import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Playlists() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/open-mics?tab=playlists", { replace: true });
  }, [navigate]);

  return null;
}
