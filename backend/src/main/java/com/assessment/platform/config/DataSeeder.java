package com.assessment.platform.config;

import com.assessment.platform.entity.Role;
import com.assessment.platform.entity.Team;
import com.assessment.platform.entity.TeamType;
import com.assessment.platform.entity.User;
import com.assessment.platform.repository.TeamRepository;
import com.assessment.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        seedTeams();
        seedAdmin();
    }

    private void seedTeams() {
        if (teamRepository.count() == 0) {
            teamRepository.save(Team.builder().name("Falconz").type(TeamType.DEV).build());
            teamRepository.save(Team.builder().name("Beyonders").type(TeamType.DEV).build());
            teamRepository.save(Team.builder().name("Eternals").type(TeamType.DATA).build());
            teamRepository.save(Team.builder().name("La Masia's").type(TeamType.DATA).build());
            teamRepository.save(Team.builder().name("Ariba").type(TeamType.DEVOPS).build());
            log.info("Teams seeded successfully");
            return;
        }

        updateTeamName("Development Team 1", "Falconz");
        updateTeamName("Development Team 2", "Beyonders");
        updateTeamName("Data Analyst Team 1", "Eternals");
        updateTeamName("Data Analyst Team 2", "La Masia's");
        updateTeamName("DevOps Team", "Ariba");
        updateTeamName("Falcons", "Falconz");
    }

    private void updateTeamName(String oldName, String newName) {
        teamRepository.findByName(oldName).ifPresent(team -> {
            team.setName(newName);
            teamRepository.save(team);
            log.info("Updated team name: {} -> {}", oldName, newName);
        });
    }

    private void seedAdmin() {
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .name("Admin")
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .role(Role.ADMIN)
                    .using2FA(false)
                    .build();
            userRepository.save(admin);
            log.info("Default admin user created: {} / (password hidden)", adminEmail);
        }
    }
}
