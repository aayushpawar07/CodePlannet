package com.assessment.platform.service;

import com.assessment.platform.dto.request.AiQuestionRequest;
import com.assessment.platform.dto.response.AiQuestionResponse;
import com.assessment.platform.exception.BadRequestException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiQuestionService {

    private static final int MAX_QUESTIONS = 15;
    private static final String GEMINI_MODEL = "gemini-2.5-flash";
    private static final String BASE_URL =
            "https://generativelanguage.googleapis.com/v1/models/%s:generateContent?key=%s";

    private final ObjectMapper objectMapper;

    @Value("${app.ai.gemini.api-key:}")
    private String apiKey;

    public AiQuestionResponse generateQuestions(AiQuestionRequest request) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new BadRequestException("AI is not configured");
        }

        int count = Math.min(request.getQuestionCount(), MAX_QUESTIONS);
        String prompt = buildPrompt(request, count);

        // Create request body using Map for flexibility
        Map<String, Object> body = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(
                    Map.of("text", prompt)
                ))
            ),
            "generationConfig", Map.of(
                "temperature", 0.3,
                "maxOutputTokens", 4096
            )
        );

        RestTemplate restTemplate = new RestTemplate();
        String url = String.format(BASE_URL, GEMINI_MODEL, apiKey);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        log.info("Calling Gemini 2.5 Flash API");
        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

        String text = extractText(response.getBody());
        log.debug("AI Response: {}", text);

        AiQuestionResponse parsed = parseQuestions(text);
        validateQuestions(parsed);

        if (parsed.getQuestions().size() > MAX_QUESTIONS) {
            parsed.setQuestions(
                parsed.getQuestions().subList(0, MAX_QUESTIONS)
            );
        }

        log.info("Generated {} questions successfully", parsed.getQuestions().size());
        return parsed;
    }

    private String buildPrompt(AiQuestionRequest request, int count) {
        return "Generate " + count + " multiple-choice questions for a " + request.getRole() + " candidate. "
                + "Tech stack: " + request.getTechStack() + ". "
                + "Level/Progress: " + request.getProgress() + ". "
                + "Return ONLY valid JSON with this exact structure and nothing else: "
                + "{\"questions\":[{\"question\":\"string\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correctIndex\":0}]} "
                + "Do not include markdown, code fences, explanations, or any extra text. Only the JSON object.";
    }

    private String extractText(Map response) {
        if (response == null) {
            throw new BadRequestException("Gemini API returned null response");
        }

        try {
            List<Map> candidates = (List<Map>) response.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                throw new BadRequestException("No candidates in response");
            }

            Map candidate = candidates.get(0);
            Map content = (Map) candidate.get("content");
            if (content == null) {
                throw new BadRequestException("No content in candidate");
            }

            List<Map> parts = (List<Map>) content.get("parts");
            if (parts == null || parts.isEmpty()) {
                throw new BadRequestException("No parts in content");
            }

            String text = (String) parts.get(0).get("text");
            if (text == null || text.isBlank()) {
                throw new BadRequestException("Empty text in response");
            }

            return text.trim();
        } catch (ClassCastException | NullPointerException ex) {
            log.error("Failed to parse response structure: {}", response, ex);
            throw new BadRequestException("Invalid response structure from Gemini API");
        }
    }

    private AiQuestionResponse parseQuestions(String text) {
        try {
            // Try to extract JSON if wrapped with markdown
            String json = extractJson(text);
            log.debug("Extracted JSON: {}", json);
            return objectMapper.readValue(json, AiQuestionResponse.class);
        } catch (Exception ex) {
            log.error("Failed to parse JSON: {}", text, ex);
            throw new BadRequestException("Failed to parse AI response as JSON: " + ex.getMessage());
        }
    }

    private void validateQuestions(AiQuestionResponse response) {
        if (response == null || response.getQuestions() == null
                || response.getQuestions().isEmpty()) {
            throw new BadRequestException("No questions generated");
        }

        for (AiQuestionResponse.AiQuestionItem item : response.getQuestions()) {
            if (item.getQuestion() == null || item.getQuestion().isBlank()) {
                throw new BadRequestException("Question text is empty");
            }

            if (item.getOptions() == null || item.getOptions().size() < 2) {
                throw new BadRequestException("Question must have at least 2 options");
            }

            if (item.getCorrectIndex() == null
                    || item.getCorrectIndex() < 0
                    || item.getCorrectIndex() >= item.getOptions().size()) {
                throw new BadRequestException("Invalid correctIndex for question");
            }
        }
    }

    private String extractJson(String text) {
        if (text == null) {
            return "{}";
        }

        String trimmed = text.trim();

        // Remove markdown code fences if present
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
        }

        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3);
        }

        trimmed = trimmed.trim();

        // If already valid JSON, return it
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            return trimmed;
        }

        // Try to find JSON object within the text
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');

        if (start >= 0 && end > start) {
            return trimmed.substring(start, end + 1);
        }

        return trimmed;
    }
}
