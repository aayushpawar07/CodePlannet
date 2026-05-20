package com.assessment.platform.controller;

import com.assessment.platform.dto.request.SubmitTestRequest;
import com.assessment.platform.dto.response.ApiResponse;
import com.assessment.platform.dto.response.SubmissionResponse;
import com.assessment.platform.dto.response.TestResponse;
import com.assessment.platform.service.TestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tests")
@RequiredArgsConstructor
public class TestController {

    private final TestService testService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TestResponse>>> getAssignedTests() {
        List<TestResponse> tests = testService.getAssignedTests();
        return ResponseEntity.ok(ApiResponse.success(tests));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TestResponse>> getTestById(@PathVariable Long id) {
        TestResponse test = testService.getTestById(id);
        return ResponseEntity.ok(ApiResponse.success(test));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<SubmissionResponse>> submitTest(
            @PathVariable Long id,
            @Valid @RequestBody SubmitTestRequest request) {
        SubmissionResponse response = testService.submitTest(id, request);
        return ResponseEntity.ok(ApiResponse.success("Test submitted successfully", response));
    }
}
