package com.assessment.platform.repository;

import com.assessment.platform.entity.Role;
import com.assessment.platform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByTeamId(Long teamId);

    List<User> findByTeamIdAndRole(Long teamId, Role role);
}
