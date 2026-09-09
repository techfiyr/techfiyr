package com.techfiyr.contact;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ContactService {
    private final ContactSubmissionRepository repository;

    public ContactService(ContactSubmissionRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void submit(ContactForm form, String source) {
        ContactSubmission submission = new ContactSubmission();
        submission.setFirstName(form.getFirstName().strip());
        submission.setLastName(clean(form.getLastName()));
        submission.setEmail(form.getEmail().strip().toLowerCase());
        submission.setSubject(clean(form.getSubject()));
        submission.setWebsite(clean(form.getWebsite()));
        submission.setMessage(form.getMessage().strip());
        submission.setSource(source);
        submission.setStatus(SubmissionStatus.NEW);
        repository.save(submission);
    }

    @Transactional(readOnly = true)
    public List<ContactSubmission> findAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public void setStatus(Long id, SubmissionStatus status) {
        ContactSubmission submission = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Message not found"));
        submission.setStatus(status);
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
