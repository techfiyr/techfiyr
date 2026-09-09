package com.techfiyr.user;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class UserManagementService {
    private final AppUserRepository repository;
    private final PasswordEncoder passwordEncoder;

    public UserManagementService(AppUserRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void createIfMissing(String username, String password, String displayName, Role role) {
        if (repository.existsByUsernameIgnoreCase(username)) {
            return;
        }
        AppUser user = new AppUser();
        user.setUsername(username.strip());
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setDisplayName(displayName);
        user.setRole(role);
        user.setEnabled(true);
        repository.save(user);
    }

    @Transactional(readOnly = true)
    public List<AppUser> findAll() {
        return repository.findAll().stream()
                .sorted(Comparator.comparing(AppUser::getUsername, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @Transactional(readOnly = true)
    public AppUser requireByUsername(String username) {
        return repository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
    }

    @Transactional
    public void create(CreateUserForm form) {
        if (repository.existsByUsernameIgnoreCase(form.getUsername())) {
            throw new IllegalArgumentException("That username is already in use.");
        }
        AppUser user = new AppUser();
        user.setUsername(form.getUsername().strip());
        user.setDisplayName(form.getDisplayName().strip());
        user.setPasswordHash(passwordEncoder.encode(form.getPassword()));
        user.setRole(form.getRole());
        user.setEnabled(true);
        repository.save(user);
    }

    @Transactional
    public void toggleEnabled(Long id, String currentUsername) {
        AppUser user = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        if (user.getUsername().equalsIgnoreCase(currentUsername)) {
            throw new IllegalArgumentException("You cannot disable your own account.");
        }
        if (user.getRole() == Role.ADMIN && user.isEnabled() && repository.countByRoleAndEnabledTrue(Role.ADMIN) <= 1) {
            throw new IllegalArgumentException("At least one administrator must remain enabled.");
        }
        user.setEnabled(!user.isEnabled());
    }

    @Transactional
    public void resetPassword(Long id, String password) {
        if (password == null || password.length() < 8 || password.length() > 72) {
            throw new IllegalArgumentException("Password must contain 8–72 characters.");
        }
        AppUser user = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        user.setPasswordHash(passwordEncoder.encode(password));
    }
}
