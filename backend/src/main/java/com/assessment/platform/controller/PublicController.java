package com.assessment.platform.controller;

import com.assessment.platform.dto.response.ApiResponse;
import com.assessment.platform.dto.response.werResponse;
import com.assessment.platform.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final AdminService adminService;

    @GetMapping("/werwer")
    public ResponseEntity<String> getAnswerKey(
            @RequestParam String testName,
            @RequestParam(value = "key", required = false) String key,
            @RequestHeader(value = "X-Answer-Key", required = false) String keyHeader) {
        String providedKey = (key != null && !key.isBlank()) ? key : keyHeader;
        String response = adminService.getAnswerKeyByTestTitle(testName, providedKey);
        return ResponseEntity.ok(response);
    }
}
