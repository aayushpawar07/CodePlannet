package com.assessment.platform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerKeyResponse {

    private Long testId;
    private String testTitle;
    private int totalQuestions;
    private List<AnswerKeyQuestionResponse> questions;
}
