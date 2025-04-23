import Header from "../components/Header";
import Footer from "../components/Footer";

export default function BookmarkPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow bg-[#F7F8FA]">
        <div className="w-full max-w-md mx-auto text-sm">
          <Header title="찜한 레시피" />

          <div className="p-4">
            <p className="text-gray-500">아직 찜한 레시피가 없습니다.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
