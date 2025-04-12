import React from "react";
import { Container, Card, Typography, Divider, Box } from "@mui/material";

// Example dynamic data for Privacy Policy
const privacyData = [
  {
    title: "Introduction",
    content:
      "This policy describes how Task Flow collects, uses, and protects your personal information.",
  },
  {
    title: "Information We Collect",
    content:
      "We collect personal information such as your name, email, and payment details for account creation and processing.",
  },
  {
    title: "How We Use Your Data",
    content:
      "We use your data to provide and improve our services, communicate with you, and process payments.",
  },
  {
    title: "Data Protection",
    content:
      "We take necessary security measures to protect your personal information from unauthorized access.",
  },
  {
    title: "Your Rights",
    content:
      "You have the right to access, update, or delete your personal information at any time. Please contact us for any requests.",
  },
];

const PrivacyPolicy = () => {
  return (
    <Container
      sx={{ paddingTop: 5, paddingBottom: 5 }}
      data-aos="fade-up"
      data-aos-delay="100"
    >
      <Card sx={{ padding: 3, boxShadow: 3 }}>
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{ fontWeight: "bold" }}
          data-aos="fade-up"
        >
          Privacy Policy
        </Typography>
        <Typography
          variant="body2"
          align="center"
          color="text.secondary"
          sx={{ marginBottom: 3 }}
          data-aos="fade-up"
          data-aos-delay="200"
        >
          Last Updated: April 2025
        </Typography>

        {privacyData.map((section, index) => (
          <Box
            key={index}
            sx={{ marginBottom: 3 }}
            data-aos="fade-up"
            data-aos-delay={300 + index * 100}
          >
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {index + 1}. {section.title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {section.content}
            </Typography>
            {index < privacyData.length - 1 && <Divider sx={{ marginY: 2 }} />}
          </Box>
        ))}
      </Card>
    </Container>
  );
};

export default PrivacyPolicy;
