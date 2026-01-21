import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "../CSS/ProductsSection.module.css";
import { type ApiData } from "../../CallApi/CallApiProduct";
import { useNavigate, createSearchParams } from "react-router";

const ProductsSection = () => {
    const [productsData, setProductsData] = useState<ApiData[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const rawData = localStorage.getItem("products");
        if (rawData) {
            try {
                setProductsData(JSON.parse(rawData));
            } catch (e) {
                console.error("Failed to parse products from local storage", e);
            }
        }
    }, []);

    const top8Items = productsData.slice(0, 8);

    // Cấu hình Embla: slidesToScroll: 1 giúp trải nghiệm mượt mà trên mobile
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: false,
        slidesToScroll: 1, // Luôn scroll 1 item, an toàn nhất cho responsive
        align: "start",
        containScroll: "trimSnaps", // Giúp không bị khoảng trắng ở cuối carousel
    });

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

        // Lắng nghe sự kiện resize để update lại trạng thái nút bấm
        emblaApi.on("select", onSelect);
        emblaApi.on("reInit", onSelect);
        emblaApi.on("resize", onSelect);
    }, [emblaApi, onSelect]);

    const scrollTo = useCallback(
        (index: number) => emblaApi?.scrollTo(index),
        [emblaApi]
    );

    const toDetailProduct = (id: number) => {
        navigate({
            pathname: "/DetailProduct",
            search: createSearchParams({ productId: id.toString() }).toString(),
        });
    };

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Sản Phẩm Nổi Bật</h2>
                    <p className={styles.subtitle}>
                        Các sản phẩm được khách hàng tin dùng và đánh giá cao
                    </p>
                </div>

                <div className={styles.carouselWrapper}>
                    <button
                        className={`${styles.navButton} ${styles.prevButton}`}
                        onClick={scrollPrev}
                        disabled={!canScrollPrev}
                    >
                        <ChevronLeft size={24} className={styles.navIcon} />
                    </button>

                    <div className={styles.carousel} ref={emblaRef}>
                        <div className={styles.carouselContainer}>
                            {top8Items.map((product: ApiData) => (
                                <div key={product.id} className={styles.slide}>
                                    <div className={styles.productCard}>
                                        <div className={styles.imageWrapper}>
                                            <img
                                                src={product.img}
                                                alt={product.productName}
                                                style={{
                                                    objectFit: "contain",
                                                    width: "80%", // Giảm width ảnh chút để không bị sát lề
                                                    height: "80%",
                                                }}
                                            />
                                        </div>
                                        <div className={styles.productInfo}>
                                            <h3
                                                className={styles.productName}
                                                title={product.productName}
                                            >
                                                {product.productName}
                                            </h3>
                                            <p className={styles.productPrice}>
                                                {new Intl.NumberFormat("vi-VN").format(product.cost)}đ
                                            </p>
                                            <button
                                                className={styles.viewBtn}
                                                onClick={() => toDetailProduct(product.id)}
                                            >
                                                Xem chi tiết
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        className={`${styles.navButton} ${styles.nextButton}`}
                        onClick={scrollNext}
                        disabled={!canScrollNext}
                    >
                        <ChevronRight size={24} className={styles.navIcon} />
                    </button>
                </div>

                <div className={styles.dots}>
                    {/* Sửa lại logic dots: Sử dụng scrollSnaps từ API thay vì tính toán thủ công */}
                    {emblaApi &&
                        emblaApi
                            .scrollSnapList()
                            .map((_, index) => (
                                <button
                                    key={index}
                                    className={`${styles.dot} ${selectedIndex === index ? styles.dotActive : ""
                                        }`}
                                    onClick={() => scrollTo(index)}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                </div>

                <button
                    className={styles.viewAllBtn}
                    onClick={() => {
                        window.location.href = "/product";
                    }}
                >
                    Xem tất cả sản phẩm
                </button>
            </div>
        </section>
    );
};

export default ProductsSection;
