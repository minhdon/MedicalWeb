import { Header } from "../../components/HeaderFooter/TSX/Header";
import { Hero } from "../../components/LandingPage/TSX/Hero";
import ProductsSection from "../../components/LandingPage/TSX/ProductsSection";
import { About } from "../../components/LandingPage/TSX/About";
import { Choice } from "../../components/LandingPage/TSX/Choice";
import { Certification } from "../../components/LandingPage/TSX/Certification";
import { Feedback } from "../../components/LandingPage/TSX/Feedback";
import { Footer } from "../../components/HeaderFooter/TSX/Footer";
import { PageContainer } from "../../components/Animation/PageContainer";

function LandingPage() {
  return (
    <>
      <Header />
      <PageContainer>
        <Hero />
        {/* <ProductsSection /> */}
        <Choice />
        <About />
        <Certification />
        {/* <Feedback /> */}
      </PageContainer>
      <Footer />
    </>
  );
}

export default LandingPage;
