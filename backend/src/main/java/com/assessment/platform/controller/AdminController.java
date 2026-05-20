package com.assessment.platform.controller;

import com.assessment.platform.dto.request.ChangeRoleRequest;
import com.assessment.platform.dto.request.CreateTestRequest;
import com.assessment.platform.dto.request.AiQuestionRequest;
import com.assessment.platform.dto.response.*;
import com.assessment.platform.service.AdminService;
import com.assessment.platform.service.AiQuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final AiQuestionService aiQuestionService;

    @PostMapping("/tests")
    public ResponseEntity<ApiResponse<TestResponse>> createTest(@Valid @RequestBody CreateTestRequest request) {
        TestResponse response = adminService.createTest(request);
        return ResponseEntity.ok(ApiResponse.success("Test created successfully", response));
    }

    @GetMapping("/tests")
    public ResponseEntity<ApiResponse<List<TestResponse>>> getAllTests() {
        List<TestResponse> tests = adminService.getAllTests();
        return ResponseEntity.ok(ApiResponse.success(tests));
    }

    @GetMapping("/tests/{id}/submissions")
    public ResponseEntity<ApiResponse<List<SubmissionResponse>>> getSubmissions(@PathVariable Long id) {
        List<SubmissionResponse> submissions = adminService.getTestSubmissions(id);
        return ResponseEntity.ok(ApiResponse.success(submissions));
    }

    @PostMapping("/tests/{id}/release")
    public ResponseEntity<ApiResponse<Void>> releaseResults(@PathVariable Long id) {
        adminService.releaseResults(id);
        return ResponseEntity.ok(ApiResponse.success("Results released successfully", null));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<ApiResponse<UserResponse>> changeRole(
            @PathVariable Long id,
            @Valid @RequestBody ChangeRoleRequest request) {
        UserResponse response = adminService.changeUserRole(id, request);
        return ResponseEntity.ok(ApiResponse.success("Role updated successfully", response));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> users = adminService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/teams")
    public ResponseEntity<ApiResponse<List<TeamResponse>>> getAllTeams() {
        List<TeamResponse> teams = adminService.getAllTeams();
        return ResponseEntity.ok(ApiResponse.success(teams));
    }

    @PostMapping("/ai-questions")
    public ResponseEntity<ApiResponse<AiQuestionResponse>> generateAiQuestions(
            @Valid @RequestBody AiQuestionRequest request) {
        AiQuestionResponse response = aiQuestionService.generateQuestions(request);
        return ResponseEntity.ok(ApiResponse.success("AI questions generated", response));
    }

    @GetMapping("/tests/{id}/scores-csv")
    public ResponseEntity<byte[]> downloadScoresCSV(@PathVariable Long id) {
        byte[] csvContent = adminService.generateScoresCSV(id);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv;charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", "test-scores-" + id + ".csv");
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(csvContent);
    }
}
