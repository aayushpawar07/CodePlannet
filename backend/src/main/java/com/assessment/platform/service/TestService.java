package com.assessment.platform.service;

import com.assessment.platform.dto.request.AnswerRequest;
import com.assessment.platform.dto.request.SubmitTestRequest;
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

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TestService {

    private final TestRepository testRepository;
    private final QuestionRepository questionRepository;
    private final OptionRepository optionRepository;
    private final SubmissionRepository submissionRepository;
    private final AnswerRepository answerRepository;
    private final UserRepository userRepository;

    public List<TestResponse> getAssignedTests() {
        CustomUserDetails userDetails = getCurrentUser();
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Test> tests = testRepository.findByAssignedTeamIdAndAssignedRole(
                user.getTeam().getId(), user.getRole());

        return tests.stream().map(test -> {
            boolean submitted = submissionRepository.existsByUserIdAndTestId(user.getId(), test.getId());
            return mapToTestResponse(test, false, submitted);
        }).collect(Collectors.toList());
    }

    public TestResponse getTestById(Long testId) {
        CustomUserDetails userDetails = getCurrentUser();
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found"));

        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!test.getAssignedTeam().getId().equals(user.getTeam().getId()) ||
                !test.getAssignedRole().equals(user.getRole())) {
            throw new BadRequestException("You are not assigned to this test");
        }

        boolean submitted = submissionRepository.existsByUserIdAndTestId(user.getId(), test.getId());
        
        if (submitted) {
            throw new BadRequestException("You have already submitted this test");
        }

        // Prevent taking test if results are released and user hasn't attempted it
        if (test.isResultsReleased()) {
            throw new BadRequestException("This test is closed. Results have been released and no further attempts are allowed");
        }

        return mapToTestResponse(test, false, false);
    }

    @Transactional
    public SubmissionResponse submitTest(Long testId, SubmitTestRequest request) {
        CustomUserDetails userDetails = getCurrentUser();
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found"));

        if (submissionRepository.existsByUserIdAndTestId(user.getId(), testId)) {
            throw new BadRequestException("You have already submitted this test");
        }

        // Prevent submission if results are released
        if (test.isResultsReleased()) {
            throw new BadRequestException("Cannot submit test - results have been released. Test is now closed for new attempts");
        }

        List<Question> questions = questionRepository.findByTestId(testId);
        int score = 0;
        int totalMarks = questions.size();

        // Parse ISO timestamp format (handles both with and without timezone)
        LocalDateTime startTime;
        try {
            // Try ISO format first (with 'Z' or timezone)
            String startTimeStr = request.getStartTime();
            if (startTimeStr.endsWith("Z")) {
                startTimeStr = startTimeStr.replace("Z", "");
            }
            // Remove milliseconds if present
            if (startTimeStr.contains(".")) {
                startTimeStr = startTimeStr.substring(0, startTimeStr.indexOf("."));
            }
            startTime = LocalDateTime.parse(startTimeStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (DateTimeParseException e) {
            // Fallback to default parsing
            startTime = LocalDateTime.parse(request.getStartTime());
        }

        Submission submission = Submission.builder()
                .user(user)
                .test(test)
                .startTime(startTime)
                .endTime(LocalDateTime.now())
                .totalMarks(totalMarks)
                .answers(new ArrayList<>())
                .build();

        submission = submissionRepository.save(submission);

        for (AnswerRequest answerReq : request.getAnswers()) {
            Question question = questionRepository.findById(answerReq.getQuestionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + answerReq.getQuestionId()));

            List<Long> selectedOptionIds = answerReq.getSelectedOptionIds() != null 
                    ? answerReq.getSelectedOptionIds() 
                    : new ArrayList<>();

            // Get all correct option IDs for this question
            Set<Long> correctOptionIds = question.getOptions().stream()
                    .filter(Option::isCorrect)
                    .map(Option::getId)
                    .collect(Collectors.toSet());

            // Check if answer is correct (all selected must be correct, and all correct must be selected)
            boolean isCorrect = !correctOptionIds.isEmpty() 
                    && selectedOptionIds.size() == correctOptionIds.size()
                    && correctOptionIds.containsAll(selectedOptionIds);

            if (isCorrect) {
                score++;
            }

            // Create Answer record for each selected option (supports multi-correct)
            for (Long optionId : selectedOptionIds) {
                Option selectedOption = optionRepository.findById(optionId)
                        .orElseThrow(() -> new ResourceNotFoundException("Option not found: " + optionId));

                Answer answer = Answer.builder()
                        .submission(submission)
                        .question(question)
                        .selectedOption(selectedOption)
                        .build();

                answerRepository.save(answer);
            }

            // If no option selected, create a single Answer record with null selectedOption
            if (selectedOptionIds.isEmpty()) {
                Answer answer = Answer.builder()
                        .submission(submission)
                        .question(question)
                        .selectedOption(null)
                        .build();
                answerRepository.save(answer);
            }
        }

        submission.setScore(score);
        submission = submissionRepository.save(submission);

        return mapToSubmissionResponse(submission, false);
    }

    public List<SubmissionResponse> getMyResults() {
        CustomUserDetails userDetails = getCurrentUser();
        List<Submission> submissions = submissionRepository.findByUserId(userDetails.getId());

        return submissions.stream()
                .filter(s -> s.getTest().isResultsReleased())
                .map(s -> mapToSubmissionResponse(s, true))
                .collect(Collectors.toList());
    }

    private TestResponse mapToTestResponse(Test test, boolean showCorrectAnswers, boolean alreadySubmitted) {
        List<QuestionResponse> questionResponses = test.getQuestions().stream()
                .map(q -> {
                    long correctCount = q.getOptions().stream()
                            .filter(Option::isCorrect)
                            .count();
                    boolean isMultiCorrect = correctCount > 1;
                    
                    return QuestionResponse.builder()
                            .id(q.getId())
                            .questionText(q.getQuestionText())
                            .options(q.getOptions().stream()
                                    .map(o -> OptionResponse.builder()
                                            .id(o.getId())
                                            .optionText(o.getOptionText())
                                            .isCorrect(showCorrectAnswers ? o.isCorrect() : null)
                                            .build())
                                    .collect(Collectors.toList()))
                            .multiCorrect(isMultiCorrect)
                            .build();
                })
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
                .alreadySubmitted(alreadySubmitted)
                .createdAt(test.getCreatedAt())
                .build();
    }

    SubmissionResponse mapToSubmissionResponse(Submission submission, boolean showAnswerKey) {
        List<AnswerResponse> answerResponses = null;
        if (showAnswerKey) {
            List<Answer> answers = answerRepository.findBySubmissionId(submission.getId());
            if (!answers.isEmpty()) {
                // Group answers by question ID
                Map<Long, List<Answer>> answersByQuestion = answers.stream()
                        .collect(Collectors.groupingBy(a -> a.getQuestion().getId()));

                answerResponses = answersByQuestion.entrySet().stream()
                        .map(entry -> {
                            Long questionId = entry.getKey();
                            List<Answer> questionAnswers = entry.getValue();

                            // Fetch question with options eagerly loaded
                            Question question = questionRepository.findByIdWithOptions(questionId)
                                    .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + questionId));

                            // Get all selected options for this question
                            List<Long> selectedOptionIds = questionAnswers.stream()
                                    .map(a -> a.getSelectedOption() != null ? a.getSelectedOption().getId() : null)
                                    .filter(id -> id != null)
                                    .collect(Collectors.toList());

                            List<String> selectedOptionTexts = questionAnswers.stream()
                                    .map(a -> a.getSelectedOption() != null ? a.getSelectedOption().getOptionText() : null)
                                    .filter(text -> text != null)
                                    .collect(Collectors.toList());

                            // Get all correct options
                            List<Option> correctOptions = question.getOptions().stream()
                                    .filter(Option::isCorrect)
                                    .collect(Collectors.toList());

                            List<Long> correctOptionIds = correctOptions.stream()
                                    .map(Option::getId)
                                    .collect(Collectors.toList());

                            List<String> correctOptionTexts = correctOptions.stream()
                                    .map(Option::getOptionText)
                                    .collect(Collectors.toList());

                            // Check if answer is correct
                            boolean isCorrect = !correctOptionIds.isEmpty()
                                    && selectedOptionIds.size() == correctOptionIds.size()
                                    && correctOptionIds.containsAll(selectedOptionIds);

                            // For backward compatibility, set single values if only one option
                            Long selectedOptionId = selectedOptionIds.size() == 1 ? selectedOptionIds.get(0) : null;
                            String selectedOptionText = selectedOptionTexts.size() == 1 ? selectedOptionTexts.get(0) : null;
                            Long correctOptionId = correctOptionIds.size() == 1 ? correctOptionIds.get(0) : null;
                            String correctOptionText = correctOptionTexts.size() == 1 ? correctOptionTexts.get(0) : null;

                            return AnswerResponse.builder()
                                    .questionId(questionId)
                                    .questionText(question.getQuestionText())
                                    .selectedOptionId(selectedOptionId)
                                    .selectedOptionText(selectedOptionText)
                                    .selectedOptionIds(selectedOptionIds)
                                    .selectedOptionTexts(selectedOptionTexts)
                                    .correctOptionId(correctOptionId)
                                    .correctOptionText(correctOptionText)
                                    .correctOptionIds(correctOptionIds)
                                    .correctOptionTexts(correctOptionTexts)
                                    .isCorrect(isCorrect)
                                    .build();
                        })
                        .collect(Collectors.toList());
            }
        }

        return SubmissionResponse.builder()
                .id(submission.getId())
                .userId(submission.getUser().getId())
                .userName(submission.getUser().getName())
                .userEmail(submission.getUser().getEmail())
                .testId(submission.getTest().getId())
                .testTitle(submission.getTest().getTitle())
                .startTime(submission.getStartTime())
                .endTime(submission.getEndTime())
                .score(submission.getScore())
                .totalMarks(submission.getTotalMarks())
                .answers(answerResponses)
                .build();
    }

    private CustomUserDetails getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (CustomUserDetails) auth.getPrincipal();
    }
}
