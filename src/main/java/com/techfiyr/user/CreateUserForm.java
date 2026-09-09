package com.techfiyr.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CreateUserForm {
    @NotBlank
    @Pattern(regexp = "[A-Za-z0-9._-]{3,80}", message = "Use 3–80 letters, numbers, dots, dashes, or underscores")
    private String username;

    @NotBlank
    @Size(max = 120)
    private String displayName;

    @NotBlank
    @Size(min = 8, max = 72)
    private String password;

    @NotNull
    private Role role = Role.EMPLOYEE;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
