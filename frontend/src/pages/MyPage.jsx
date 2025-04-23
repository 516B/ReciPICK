import Header from "../components/Header";
import Footer from "../components/Footer";

export default function MyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow bg-[#F7F8FA]">
        <div className="w-full max-w-md mx-auto text-sm">
          <Header title="마이페이지" />

          <div className="p-4">
            <p className="text-gray-500">마이페이지 입니다.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
