package com.techfiyr.contact;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ContactForm {
    @NotBlank
    @Size(max = 100)
    private String firstName;

    @Size(max = 100)
    private String lastName;

    @NotBlank
    @Email
    @Size(max = 254)
    private String email;

    @Size(max = 180)
    private String subject;

    @Size(max = 500)
    private String website;

    @NotBlank
    @Size(max = 5000)
    private String message;

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
