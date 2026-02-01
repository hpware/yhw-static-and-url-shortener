export default function NotFound() {
  return (
    <div className="flex flex-col justify-center items-center absolute inset-0">
      <div className="flex flex-col justify-center items-center">
        <h1 className="text-9xl font-bold italic ubuntu-font animate__animated animate__flash">
          404
        </h1>
        <span className="text-2xl huninn-font">這個頁面不存在</span>
        <span>
          管理員: <a href="mailto:webmaster@yhw.tw">webmaster@yhw.tw</a>
        </span>
      </div>
    </div>
  );
}
