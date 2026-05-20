package com.assessment.platform.repository;

import com.assessment.platform.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {

    List<Answer> findBySubmissionId(Long submissionId);

    void deleteBySubmissionId(Long submissionId);
}
