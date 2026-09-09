package com.techfiyr.config;

import com.techfiyr.cms.CmsPageService;
import com.techfiyr.user.Role;
import com.techfiyr.user.UserManagementService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class ApplicationBootstrap implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(ApplicationBootstrap.class);
    private final CmsPageService pageService;
    private final UserManagementService userService;
    private final BootstrapProperties properties;

    public ApplicationBootstrap(CmsPageService pageService,
                                UserManagementService userService,
                                BootstrapProperties properties) {
        this.pageService = pageService;
        this.userService = userService;
        this.properties = properties;
    }

    @Override
    public void run(ApplicationArguments args) {
        pageService.initializeMissingPages();
        userService.createIfMissing(properties.adminUsername(), properties.adminPassword(), "Administrator", Role.ADMIN);
        userService.createIfMissing(properties.employeeUsername(), properties.employeePassword(), "Employee", Role.EMPLOYEE);
        if ("ChangeMe123!".equals(properties.adminPassword())) {
            log.warn("The default administrator password is active. Set ADMIN_PASSWORD before deployment.");
        }
    }
}
