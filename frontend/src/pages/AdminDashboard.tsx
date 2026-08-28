import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import type { Survey } from "../types";
import { Plus, BarChart2, ExternalLink } from "lucide-react";

export default function AdminDashboard() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:3000/api/surveys")
      .then(res => setSurveys(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-10">Loading surveys...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Surveys</h1>
        <Link 
          to="/admin/survey/new" 
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
        >
          <Plus size={20} /> Create Survey
        </Link>
      </div>

      {surveys.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <h3 className="text-xl font-medium text-gray-700 mb-2">No surveys yet</h3>
          <p className="text-gray-500 mb-6">Create your first survey to start collecting responses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map(survey => (
            <div key={survey.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
              <h2 className="text-xl font-semibold text-gray-800 mb-2 truncate">{survey.title}</h2>
              <p className="text-gray-500 text-sm mb-6 line-clamp-2 min-h-[40px]">
                {survey.description || "No description provided."}
              </p>
              
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <Link 
                  to={`/admin/survey/${survey.id}/analytics`}
                  className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition"
                >
                  <BarChart2 size={16} /> Analytics
                </Link>
                <Link 
                  to={`/survey/${survey.id}`}
                  target="_blank"
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
                >
                  <ExternalLink size={16} /> View Form
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
