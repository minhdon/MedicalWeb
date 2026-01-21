import React from "react";
import { Header } from "../../components/HeaderFooter/TSX/Header";
import { Container } from "../../components/Product/TSX/Container";
import "../CSS/ProductPage.css";
import { Footer } from "../../components/HeaderFooter/TSX/Footer";
import { PageContainer } from "../../components/Animation/PageContainer";

function ProductPage() {
  return (
    <>
      <Header />
      <PageContainer>
        <div className="product-page-wrapper">
          <Container />
        </div>
      </PageContainer>
      <Footer />
    </>
  );
}

export default ProductPage;
