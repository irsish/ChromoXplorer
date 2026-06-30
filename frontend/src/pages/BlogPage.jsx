import styles from "./BlogPage.module.css";
import { Container, Row, Col, Button } from "reactstrap";
import React from "react";

export default function BlogPage() {
    const posts = [
        {
            postID: 1,
            title: "Post #1",
            message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        },
        {
            postID: 2,
            title: "Post #2",
            message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        },
        {
            postID: 3,
            title: "Post #3",
            message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        },
        {
            postID: 4,
            title: "Post #4",
            message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        },
    ]

    return (
        <>
            {/* HERO */}
            <div className={styles.hero}>
                <Container className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>Blog</h1>
                    <h3 className={styles.heroSubtitle}>
                        News and Updates
                    </h3>
                </Container>
            </div>

            {/* BLOG SECTION */}
            <div className={styles.blogSection}>
                <Container>
                    <Row className={`gy-4 ${styles.blogRow}`}>
                        <Col md={3}>
                            <h3>Blog</h3>
                            <hr/>
                            <ul class="nav flex-column">
                                {posts.map((post) => (
                                    <li className={styles.navItem}>
                                        <a class={styles.navLink} href={`#${post.postID}`}>{post.title}</a>
                                    </li>
                                ))}
                            </ul>
                        </Col>
                        <Col md={9}>
                            <h3><small>RECENT POST</small></h3>
                            <hr />
                            {posts.map((post) => (
                                <div className={styles.card}>
                                    <div className={styles.cardBody}>
                                        <h4 className={styles.cardTitle} id={post.postID}>{post.title}</h4>
                                        <p className={styles.cardText}>
                                            {post.message}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    )
}
