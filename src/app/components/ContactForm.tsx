"use client";
import React, { useState } from "react";

const DOCUMENT_TYPES = [
  { id: "resume", label: "Resume/CV *", required: true },
  { id: "degree", label: "Degree Certificate *", required: true },
  { id: "idProof", label: "ID Proof *", required: true },
  { id: "experience", label: "Experience Certificates", required: false },
  { id: "certification1", label: "Certification 1", required: false },
  { id: "certification2", label: "Certification 2", required: false },
  { id: "other", label: "Other Document", required: false }
];

const LOCATIONS = [
  "Bala Cynwyd Office",
  "Philadelphia Office", 
  "South Philadelphia Satellite Office"
];

const JOB_POSITIONS = [
  "Behavior Consultant (BC)",
  "Mobile Therapist (MT)",
  "Registered Behavior Technician (RBT)",
  "Behavior Technician (BT)",
  "Administration"
];

const JobApplication = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    position: "",
    location: ""
  });

  const [files, setFiles] = useState<Record<string, File | null>>(
    DOCUMENT_TYPES.reduce((acc, doc) => ({ ...acc, [doc.id]: null }), {})
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setSubmitError(`Only PDF, DOC, and DOCX files are allowed for ${docId}`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setSubmitError(`File size should be less than 5MB for ${docId}`);
        return;
      }
    }

    setFiles(prev => ({ ...prev, [docId]: file }));
    setSubmitError("");
  };

  const removeFile = (docId: string) => {
    setFiles(prev => ({ ...prev, [docId]: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess(false);
    setIsSubmitting(true);

    const errors = [];
    if (!formData.fullName) errors.push("Full Name");
    if (!formData.email) errors.push("Email");
    if (!formData.position) errors.push("Job Position");
    if (!formData.location) errors.push("Location");
    
    DOCUMENT_TYPES.forEach(doc => {
      if (doc.required && !files[doc.id]) {
        errors.push(doc.label);
      }
    });

    if (errors.length > 0) {
      setSubmitError(`Please fill all required fields: ${errors.join(", ")}`);
      setIsSubmitting(false);
      return;
    }

    try {
      const formPayload = new FormData();
      formPayload.append("fullName", formData.fullName);
      formPayload.append("email", formData.email);
      formPayload.append("phone", formData.phone || "");
      formPayload.append("position", formData.position);
      formPayload.append("location", formData.location);

      Object.entries(files).forEach(([docId, file]) => {
        if (file) formPayload.append(docId, file);
      });

      const response = await fetch("/api/send-email", {
        method: "POST",
        body: formPayload,
      });

      if (!response.ok) throw new Error("Submission failed");

      setFormData({
        fullName: "",
        email: "",
        phone: "",
        position: "",
        location: ""
      });
      setFiles(DOCUMENT_TYPES.reduce((acc, doc) => ({ ...acc, [doc.id]: null }), {}));
      setSubmitSuccess(true);

    } catch (error) {
      setSubmitError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-blue-600 mb-2">Document Submission Form</h2>
      <p className="text-gray-600 mb-6">
        Please complete this form to apply for a position at our organization.
      </p>

      {submitError && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {submitError}
        </div>
      )}

      {submitSuccess && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
          Thank you for your application! Our HR team will review your documents and contact you 
          through the email you provided if they wish to proceed with your candidacy.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name *</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Position *</label>
            <select
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md"
              required
            >
              <option value="">Select Position</option>
              {JOB_POSITIONS.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location *</label>
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md"
              required
            >
              <option value="">Select Location</option>
              {LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Required Documents</h3>
          {DOCUMENT_TYPES.filter(doc => doc.required).map(doc => (
            <div key={doc.id} className="border rounded p-4">
              <label className="block text-sm font-medium mb-2">
                {doc.label}
              </label>
              {files[doc.id] ? (
                <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
                  <span className="truncate">{files[doc.id]?.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(doc.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  onChange={(e) => handleFileChange(doc.id, e)}
                  accept=".pdf,.doc,.docx"
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              )}
              <p className="text-xs text-gray-500 mt-1">PDF, DOC, or DOCX (max 5MB)</p>
            </div>
          ))}

          <h3 className="text-lg font-semibold">Additional Documents</h3>
          {DOCUMENT_TYPES.filter(doc => !doc.required).map(doc => (
            <div key={doc.id} className="border rounded p-4">
              <label className="block text-sm font-medium mb-2">
                {doc.label}
              </label>
              {files[doc.id] ? (
                <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
                  <span className="truncate">{files[doc.id]?.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(doc.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  onChange={(e) => handleFileChange(doc.id, e)}
                  accept=".pdf,.doc,.docx"
                  className="w-full px-3 py-2 border rounded"
                />
              )}
              <p className="text-xs text-gray-500 mt-1">PDF, DOC, or DOCX (max 5MB)</p>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition ${
            isSubmitting ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
};

export default JobApplication;