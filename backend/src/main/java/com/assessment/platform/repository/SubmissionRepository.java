package com.assessment.platform.repository;

import com.assessment.platform.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    boolean existsByUserIdAndTestId(Long userId, Long testId);

    Optional<Submission> findByUserIdAndTestId(Long userId, Long testId);

    List<Submission> findByTestId(Long testId);

    List<Submission> findByUserId(Long userId);
}
