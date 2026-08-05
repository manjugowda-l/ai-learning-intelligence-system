import { BookOpen, LayoutDashboard, Settings, LogOut, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {useState,useEffect} from "react"
import { useAuth } from "../../context/AuthContext.jsx";


export function Sidebar({ currentPage,children }) {
   const { user} = useAuth();
  const [formState, setFormState] = useState({
      username: "",
      email: "",
    });

  useEffect(() => {
      if (user) {
        setFormState({
          username: user.fullName || user.username || "",
          email: user.email || "",
          bio: user.bio || "",
        });
      }
    }, [user]);
  




    const navigate=useNavigate();
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "analytics", label: "Analytics", icon: BarChart2 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#F3F4F6" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 260,
          minWidth: 260,
          backgroundColor: "#fff",
          borderRight: "1px solid #E5E7EB",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          zIndex: 40,
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "20px 20px",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              backgroundColor: "#DC2626",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen size={16} color="#fff" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>AI-Study Copilot</span>
        </div>

        {/* Navigation */}
        <nav style={{ padding: "12px 12px", flex: 1 }}>
            {/* maps to the button at the same time compares */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              currentPage === item.id ||
              (item.id === "dashboard" &&
                ["dashboard", "track", "topic", "summary"].includes(currentPage));
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/${item.id}`)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: active ? "#FEF2F2" : "transparent",
                  color: active ? "#DC2626" : "#6B7280",
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  cursor: "pointer",
                  marginBottom: 2,
                  textAlign: "left",
                }}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Profile Card */}
        <div
          style={{
            padding: 16,
            borderTop: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "#DC2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>JD</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {formState.username}
            </div>
            <div style={{ fontSize: 12, color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {formState.email}
            </div>
          </div>
          <button
            onClick={() => navigate("/")}
            style={{
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
              padding: 4,
              color: "#9CA3AF",
              display: "flex",
              alignItems: "center",
            }}
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          marginLeft: 260,
          overflowY: "auto",
          minHeight: "100vh",
        }}
      >
        {children}
      </main>
    </div>
  );
}
