export default function Footer() {
    return (
        <footer className="w-full mt-4 py-2 border-t border-border flex flex-col items-center justify-center gap-2 text-textMuted">
            <div className="flex items-center gap-6">
                <a
                    href="https://www.instagram.com/sexto.hombre.fantasy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors hover:scale-110"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                    </svg>
                </a>
                <a
                    href="https://x.com/SextoHombreFant"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors hover:scale-110"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M4 4l11.733 16h4.267l-11.733 -16z"></path>
                        <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path>
                    </svg>
                </a>
            </div>
            <p className="text-[10px] md:text-xs font-medium text-center px-2">
                &copy; {new Date().getFullYear()} Sexto Hombre Fantasy. Todos los derechos reservados.
            </p>
        </footer>
    )
}
