package com.techfiyr;

import com.techfiyr.contact.ContactSubmissionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ApplicationIntegrationTest {
    @Autowired MockMvc mockMvc;
    @Autowired ContactSubmissionRepository submissions;

    @Test
    void publicHomeIsRenderedFromSeededCmsPage() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/html"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("TechFiyr")))
                .andExpect(content().string(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString("cms-account-controls")
                )));
    }

    @Test
    void loginRemainsAvailableByDirectUrl() throws Exception {
        mockMvc.perform(get("/login"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Welcome back")));
    }

    @Test
    void anonymousUserCannotOpenAdmin() throws Exception {
        mockMvc.perform(get("/admin")).andExpect(status().is3xxRedirection());
    }

    @Test
    void loginStylesheetIsPublic() throws Exception {
        mockMvc.perform(get("/admin/admin.css"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/css"));
    }

    @Test
    @WithMockUser(roles = "EMPLOYEE")
    void employeeCannotOpenAdmin() throws Exception {
        mockMvc.perform(get("/admin")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCanOpenPageEditor() throws Exception {
        mockMvc.perform(get("/admin/pages/home/edit"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Save all changes")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void allAdminScreensRender() throws Exception {
        for (String path : new String[]{"/admin", "/admin/pages", "/admin/media", "/admin/messages", "/admin/users"}) {
            mockMvc.perform(get(path)).andExpect(status().isOk());
        }
    }

    @Test
    @WithMockUser(username = "employee", roles = "EMPLOYEE")
    void employeeDashboardRenders() throws Exception {
        mockMvc.perform(get("/employee"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Employee workspace")));
    }

    @Test
    void validContactFormIsPersisted() throws Exception {
        long before = submissions.count();
        mockMvc.perform(post("/contact").with(csrf())
                        .param("firstName", "Ada")
                        .param("lastName", "Lovelace")
                        .param("email", "ada@example.com")
                        .param("subject", "Project")
                        .param("message", "Please contact me."))
                .andExpect(redirectedUrl("/contact?sent=1"));
        assertThat(submissions.count()).isEqualTo(before + 1);
    }
}
