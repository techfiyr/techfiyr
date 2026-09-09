package com.techfiyr.contact;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContactSubmissionRepository extends JpaRepository<ContactSubmission, Long> {
    List<ContactSubmission> findAllByOrderByCreatedAtDesc();
    long countByStatus(SubmissionStatus status);
}
