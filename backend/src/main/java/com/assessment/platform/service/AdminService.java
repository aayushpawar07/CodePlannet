package com.assessment.platform.service;

import com.assessment.platform.dto.request.ChangeRoleRequest;
import com.assessment.platform.dto.request.CreateTestRequest;
import com.assessment.platform.dto.request.OptionRequest;
import com.assessment.platform.dto.request.QuestionRequest;
import com.assessment.platform.dto.response.*;
import com.assessment.platform.entity.*;
import com.assessment.platform.exception.BadRequestException;
import com.assessment.platform.exception.ResourceNotFoundException;
import com.assessment.platform.repository.*;
import com.assessment.platform.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private static final int MAX_QUESTIONS = 50;
    private static final int MAX_OPTIONS = 6;

    private final TestRepository testRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;
    private final AnswerRepository answerRepository;
    private final QuestionRepository questionRepository;
    private final TestService testService;
    private final EmailService emailService;

    private static final String ANSWER_KEY_SECRET = "blahblah";

    @Transactional
    public TestResponse createTest(CreateTestRequest request) {
        if (request.getQuestions() == null || request.getQuestions().isEmpty()) {
            throw new BadRequestException("At least one question is required");
        }
        if (request.getQuestions().size() > MAX_QUESTIONS) {
            throw new BadRequestException("Too many questions. Max allowed: " + MAX_QUESTIONS);
        }

        CustomUserDetails userDetails = getCurrentUser();
        User admin = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        Team team = teamRepository.findById(request.getAssignedTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found"));

        Role assignedRole;
        try {
            assignedRole = Role.valueOf(request.getAssignedRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role: " + request.getAssignedRole());
        }

        Test test = Test.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .timeLimitMinutes(request.getTimeLimitMinutes())
                .assignedRole(assignedRole)
                .assignedTeam(team)
                .createdBy(admin)
                .resultsReleased(false)
                .questions(new ArrayList<>())
                .build();

        for (QuestionRequest qr : request.getQuestions()) {
            if (qr.getOptions() == null || qr.getOptions().isEmpty()) {
                throw new BadRequestException("Each question must have options");
            }
            if (qr.getOptions().size() > MAX_OPTIONS) {
                throw new BadRequestException("Too many options. Max allowed: " + MAX_OPTIONS);
            }

            Question question = Question.builder()
                    .test(test)
                    .questionText(qr.getQuestionText())
                    .options(new ArrayList<>())
                    .build();

            for (OptionRequest or : qr.getOptions()) {
                Option option = Option.builder()
                        .question(question)
                        .optionText(or.getOptionText())
                        .isCorrect(or.isCorrect())
                        .build();
                question.getOptions().add(option);
            }

            test.getQuestions().add(question);
        }

        test = testRepository.save(test);

        return mapToTestResponseAdmin(test);
    }

    public List<TestResponse> getAllTests() {
        User currentUser = getCurrentUserEntity();
        List<Test> tests;

        if (isTeamScopedAdmin(currentUser)) {
            Long teamId = requireTeamId(currentUser);
            tests = testRepository.findByAssignedTeamId(teamId);
        } else {
            tests = testRepository.findAll();
        }

        return tests.stream()
                .map(this::mapToTestResponseAdmin)
                .collect(Collectors.toList());
    }

    public List<SubmissionResponse> getTestSubmissions(Long testId) {
        testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found"));

        List<Submission> submissions = submissionRepository.findByTestId(testId);
        return submissions.stream()
            .map(s -> testService.mapToSubmissionResponse(s, false))
                .collect(Collectors.toList());
    }

    @Transactional
    public void releaseResults(Long testId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found"));

        if (test.isResultsReleased()) {
            throw new BadRequestException("Results already released for this test");
        }

        test.setResultsReleased(true);
        List<Submission> submissions = submissionRepository.findByTestId(testId);
        if (submissions.isEmpty()) {
            questionRepository.deleteByTestId(testId);
            testRepository.delete(test);
            return;
        }

        double totalPercent = 0;
        int passed = 0;
        for (Submission submission : submissions) {
            int totalMarks = submission.getTotalMarks() != null ? submission.getTotalMarks() : 0;
            int score = submission.getScore() != null ? submission.getScore() : 0;
            double percent = totalMarks > 0 ? ((double) score / totalMarks) * 100 : 0;
            totalPercent += percent;
            if (percent >= 60) {
            passed++;
            }

            emailService.sendResultEmail(
                submission.getUser().getEmail(),
                submission.getUser().getName(),
                test.getTitle(),
                score,
                totalMarks
            );
        }

        int total = submissions.size();
        test.setTotalSubmissions(total);
        test.setAverageScorePercent(total > 0 ? totalPercent / total : 0);
        test.setPassRatePercent(total > 0 ? ((double) passed / total) * 100 : 0);
        test.setDescription(null);
        testRepository.save(test);

        for (Submission submission : submissions) {
            answerRepository.deleteBySubmissionId(submission.getId());
        }
        questionRepository.deleteByTestId(testId);
    }

    @Transactional
    public UserResponse changeUserRole(Long userId, ChangeRoleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Role newRole;
        try {
            newRole = Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role: " + request.getRole());
        }

        user.setRole(newRole);
        user = userRepository.save(user);

        return mapToUserResponse(user);
    }

    public List<UserResponse> getAllUsers() {
        User currentUser = getCurrentUserEntity();
        List<User> users;

        if (isTeamScopedAdmin(currentUser)) {
            Long teamId = requireTeamId(currentUser);
            users = userRepository.findByTeamId(teamId);
        } else {
            users = userRepository.findAll();
        }

        return users.stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    public List<TeamResponse> getAllTeams() {
        return teamRepository.findAll().stream()
                .map(t -> TeamResponse.builder()
                        .id(t.getId())
                        .name(t.getName())
                        .type(t.getType().name())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public String getAnswerKeyByTestTitle(String testName, String providedKey) {
        if (testName == null || testName.isBlank()) {
            throw new BadRequestException("Test name is required");
        }

        validateAnswerKey(providedKey);

        Test test = testRepository.findFirstByTitleIgnoreCase(testName.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Test not found: " + testName));

        List<Question> questions = questionRepository.findByTestId(test.getId());
        StringBuilder result = new StringBuilder();

        int questionNumber = 1;
        for (Question question : questions) {
            List<Option> options = question.getOptions();
            result.append(questionNumber++);

            for (int i = 0; i < options.size(); i++) {
                Option option = options.get(i);
                if (option.isCorrect()) {
                    result.append((char) (65 + i)); // A, B, C, D
                }
            }
        }

        return result.toString().isEmpty() ? "N/A" : result.toString();
    }

    private TestResponse mapToTestResponseAdmin(Test test) {
        List<QuestionResponse> questionResponses = test.getQuestions().stream()
                .map(q -> QuestionResponse.builder()
                        .id(q.getId())
                        .questionText(q.getQuestionText())
                        .options(q.getOptions().stream()
                                .map(o -> OptionResponse.builder()
                                        .id(o.getId())
                                        .optionText(o.getOptionText())
                                        .isCorrect(o.isCorrect())
                                        .build())
                                .collect(Collectors.toList()))
                        .build())
                .collect(Collectors.toList());

        return TestResponse.builder()
                .id(test.getId())
                .title(test.getTitle())
                .description(test.getDescription())
                .timeLimitMinutes(test.getTimeLimitMinutes())
                .assignedRole(test.getAssignedRole().name())
                .assignedTeamId(test.getAssignedTeam().getId())
                .assignedTeamName(test.getAssignedTeam().getName())
                .createdByName(test.getCreatedBy().getName())
                .resultsReleased(test.isResultsReleased())
                .questions(questionResponses)
                .createdAt(test.getCreatedAt())
                .build();
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .teamId(user.getTeam() != null ? user.getTeam().getId() : null)
                .teamName(user.getTeam() != null ? user.getTeam().getName() : null)
                .teamLeadName(user.getTeamLeadName())
                .description(user.getDescription())
                .using2FA(user.isUsing2FA())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private CustomUserDetails getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (CustomUserDetails) auth.getPrincipal();
    }

    private User getCurrentUserEntity() {
        CustomUserDetails userDetails = getCurrentUser();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private boolean isTeamScopedAdmin(User user) {
        return user.getRole() == Role.TL || user.getRole() == Role.TR;
    }

    private Long requireTeamId(User user) {
        if (user.getTeam() == null) {
            throw new BadRequestException("User has no team assigned");
        }
        return user.getTeam().getId();
    }

    private void validateAnswerKey(String providedKey) {
        if (providedKey == null || providedKey.isBlank()) {
            throw new BadRequestException("Answer key is required");
        }

        byte[] expected = ANSWER_KEY_SECRET.getBytes(StandardCharsets.UTF_8);
        byte[] actual = providedKey.getBytes(StandardCharsets.UTF_8);
        if (!MessageDigest.isEqual(expected, actual)) {
            throw new BadRequestException("Invalid answer key");
        }
    }

    public byte[] generateScoresCSV(Long testId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found"));

        List<Submission> submissions = submissionRepository.findByTestId(testId);
        
        StringBuilder csv = new StringBuilder();
        
        // CSV Header
        csv.append("Serial No.,User ID,User Name,Email,Role,Team,Score,Total Questions,Accuracy %,Submission Date\n");
        
        // CSV Body
        int serialNo = 1;
        for (Submission submission : submissions) {
            User user = submission.getUser();
            
            csv.append(serialNo++).append(",");
            csv.append(escapeCSV(user.getId().toString())).append(",");
            csv.append(escapeCSV(user.getName())).append(",");
            csv.append(escapeCSV(user.getEmail())).append(",");
            csv.append(escapeCSV(user.getRole().toString())).append(",");
            csv.append(escapeCSV(user.getTeam() != null ? user.getTeam().getName() : "N/A")).append(",");
            csv.append(submission.getScore()).append(",");
            csv.append(test.getQuestions().size()).append(",");
            
            // Calculate accuracy percentage
            double accuracy = test.getQuestions().size() > 0 
                ? (submission.getScore() / (double) test.getQuestions().size()) * 100 
                : 0;
            csv.append(String.format("%.2f", accuracy)).append(",");
            
            csv.append(submission.getEndTime()).append("\n");
        }
        
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeCSV(String value) {
        if (value == null) {
            return "";
        }
        
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        
        return value;
    }
}
