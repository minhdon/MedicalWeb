import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import styles from "../CSS/Feedback.module.css";

const testimonials = [
  {
    name: "Nguyễn Văn An",
    rating: 5,
    quote:
      "Nhà thuốc rất uy tín, dược sĩ tư vấn nhiệt tình và chuyên nghiệp. Tôi rất yên tâm khi mua thuốc ở đây cho cả gia đình.",
  },
  {
    name: "Huỳnh Tiết Triều",
    rating: 5,
    quote:
      "Tôi bị bệnh mất trí nhớ sau khi dùng thuốc ở đây đã cải thiện rõ rệt. Cảm ơn nhà thuốc rất nhiều!",
  },
  {
    name: "Lê Minh Cường",
    rating: 5,
    quote:
      "Đã là khách hàng thân thiết hơn 3 năm. Chất lượng thuốc đảm bảo, nhân viên luôn thân thiện và nhiệt tình.",
  },
  {
    name: "Phạm Thị Dung",
    rating: 4,
    quote:
      "Rất hài lòng với dịch vụ giao hàng trong 2 giờ. Mỗi lần cần thuốc gấp đều được hỗ trợ kịp thời.",
  },
  {
    name: "Hoàng Văn Em",
    rating: 5,
    quote:
      "Nhà thuốc có đầy đủ các loại thuốc, từ thuốc thông thường đến thuốc chuyên khoa. Rất tiện lợi.",
  },
  {
    name: "Vũ Thị Phương",
    rating: 5,
    quote:
      "Tin tưởng tuyệt đối vào chất lượng thuốc ở đây. Đã giới thiệu cho nhiều bạn bè và người thân.",
  },
];

export const Feedback = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  );

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        size={16}
        className={index < rating ? styles.star : styles.starEmpty}
        fill={index < rating ? "#fbbf24" : "none"}
      />
    ));
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Khách Hàng Nói Gì Về Chúng Tôi</h2>
          <p className={styles.subtitle}>
            Những đánh giá chân thực từ khách hàng đã tin tưởng sử dụng dịch vụ
          </p>
        </div>

        <div className={styles.carouselWrapper}>
          <button
            className={`${styles.navButton} ${styles.prevButton}`}
            onClick={scrollPrev}
          >
            <ChevronLeft size={24} className={styles.navIcon} />
          </button>

          <div className={styles.carousel} ref={emblaRef}>
            <div className={styles.carouselContainer}>
              {testimonials.map((testimonial, index) => (
                <div key={index} className={styles.slide}>
                  <div className={styles.card}>
                    <div className={styles.cardHeader}>
                      <div className={styles.avatar}>
                        {testimonial.name.charAt(0)}
                      </div>
                      <div className={styles.info}>
                        <h4 className={styles.name}>{testimonial.name}</h4>
                        <div className={styles.rating}>
                          {renderStars(testimonial.rating)}
                        </div>
                      </div>
                    </div>
                    <p className={styles.quote}>{testimonial.quote}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            className={`${styles.navButton} ${styles.nextButton}`}
            onClick={scrollNext}
          >
            <ChevronRight size={24} className={styles.navIcon} />
          </button>
        </div>

        <div className={styles.dots}>
          {Array.from({ length: Math.ceil(testimonials.length / 3) }).map(
            (_, index) => (
              <button
                key={index}
                className={`${styles.dot} ${selectedIndex === index ? styles.dotActive : ""
                  }`}
                onClick={() => scrollTo(index)}
              />
            )
          )}
        </div>
      </div>
    </section>
  );
};
