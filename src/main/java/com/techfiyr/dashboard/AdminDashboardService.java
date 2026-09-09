package com.techfiyr.dashboard;

import com.techfiyr.cms.CmsPageRepository;
import com.techfiyr.contact.ContactSubmissionRepository;
import com.techfiyr.contact.SubmissionStatus;
import com.techfiyr.media.MediaAssetRepository;
import com.techfiyr.user.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminDashboardService {
    private final CmsPageRepository pageRepository;
    private final AppUserRepository userRepository;
    private final ContactSubmissionRepository submissionRepository;
    private final MediaAssetRepository mediaRepository;

    public AdminDashboardService(CmsPageRepository pageRepository,
                                 AppUserRepository userRepository,
                                 ContactSubmissionRepository submissionRepository,
                                 MediaAssetRepository mediaRepository) {
        this.pageRepository = pageRepository;
        this.userRepository = userRepository;
        this.submissionRepository = submissionRepository;
        this.mediaRepository = mediaRepository;
    }

    @Transactional(readOnly = true)
    public DashboardStats getStats() {
        return new DashboardStats(
                pageRepository.count(),
                userRepository.count(),
                submissionRepository.countByStatus(SubmissionStatus.NEW),
                mediaRepository.count()
        );
    }
}
