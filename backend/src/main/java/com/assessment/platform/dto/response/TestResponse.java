package com.assessment.platform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestResponse {

    private Long id;
    private String title;
    private String description;
    private Integer timeLimitMinutes;
    private String assignedRole;
    private Long assignedTeamId;
    private String assignedTeamName;
    private String createdByName;
    private boolean resultsReleased;
    private List<QuestionResponse> questions;
    private boolean alreadySubmitted;
    private LocalDateTime createdAt;
}
