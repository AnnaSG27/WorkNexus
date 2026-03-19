import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CategorySection from "@/components/CategorySection";
import FeaturedServices from "@/components/FeaturedServices";
import TopFreelancers from "@/components/TopFreelancers";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <CategorySection />
      <FeaturedServices />
      <TopFreelancers />
      <HowItWorks />
      <Footer />
    </div>
  );
};

export default Index;
