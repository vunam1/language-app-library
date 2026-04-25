import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Local MVP</p>
        <h1>English Communication MVP</h1>
        <p>
          Ứng dụng tối thiểu để đọc các lesson markdown hiện có trong repo và
          kiểm tra nhanh nội dung học tiếng Anh giao tiếp theo từng tháng.
        </p>
        <Link className="button" href="/lessons">
          Xem danh sách lesson
        </Link>
      </section>
    </main>
  );
}
