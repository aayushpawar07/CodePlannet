package com.assessment.platform.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AnswerResponse {

    private Long questionId;
    private String questionText;
    
    // For single-correct: one value, for multi-correct: list of values
    private Long selectedOptionId; // Deprecated: use selectedOptionIds
    private String selectedOptionText; // Deprecated: use selectedOptionTexts
    private List<Long> selectedOptionIds;
    private List<String> selectedOptionTexts;
    
    private Long correctOptionId; // Deprecated: use correctOptionIds
    private String correctOptionText; // Deprecated: use correctOptionTexts
    private List<Long> correctOptionIds;
    private List<String> correctOptionTexts;
    
    private boolean isCorrect;
}
