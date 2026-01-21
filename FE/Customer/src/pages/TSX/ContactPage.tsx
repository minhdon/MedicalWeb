import React from "react";
import { Contact } from "../../components/Contact/TSX/Contact";
import { Header } from "../../components/HeaderFooter/TSX/Header";
import { Footer } from "../../components/HeaderFooter/TSX/Footer";
import { PageContainer } from "../../components/Animation/PageContainer";

function ContactPage() {
  return (
    <>
      <Header />
      <PageContainer>
        <Contact />
      </PageContainer>
      <Footer />
    </>
  );
}

export default ContactPage;
