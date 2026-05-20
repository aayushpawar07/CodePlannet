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
public class werQuestionResponse {

    private int questionNumber;
    private Long questionId;
    private String questionText;
    private List<Long> correctOptionIds;
    private List<String> correctOptionTexts;
}
