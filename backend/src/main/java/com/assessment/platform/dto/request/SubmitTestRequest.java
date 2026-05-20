package com.assessment.platform.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class SubmitTestRequest {

    @NotNull(message = "Start time is required")
    private String startTime;

    @NotEmpty(message = "Answers are required")
    private List<AnswerRequest> answers;
}
