"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, CheckCircle, AlertCircle, Download, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";

interface ImportData {
  unique_identifier: string;
  openMic: string;
  venueName: string;
  borough: string;
  neighborhood: string;
  day: string;
  startTime: string;
  stageTime: string;
  cost: string;
  location: string;
  lastVerified: string;
  status: "pending" | "valid" | "error";
  errors?: string[];
}

const BulkImportInterface = () => {
  console.log('BulkImportInterface component is being called');
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportData[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [columnErrors, setColumnErrors] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string[] }>({});
  const [validationResults, setValidationResults] = useState<{ isValid: boolean; errors: string[] }>({ isValid: false, errors: [] });
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);

  useEffect(() => {
    const handleDocumentDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDocumentDragEnter = (e: DragEvent) => {
      e.preventDefault();
      // Don't show overlay if dragging over the upload area
      if (e.target && (e.target as Element).closest('.upload-area')) {
        return;
      }
      setIsDragOver(true);
    };

    const handleDocumentDragLeave = (e: DragEvent) => {
      e.preventDefault();
      // Don't hide overlay if leaving the upload area
      if (e.target && (e.target as Element).closest('.upload-area')) {
        return;
      }
      if (!e.relatedTarget) {
        setIsDragOver(false);
      }
    };

    const handleDocumentDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer?.files || []);
      const file = files[0];

      if (file && (file.name.endsWith(".csv") || file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
        setUploadedFile(file);
        parseFile(file);
      }
    };

    document.addEventListener("dragover", handleDocumentDragOver);
    document.addEventListener("dragenter", handleDocumentDragEnter);
    document.addEventListener("dragleave", handleDocumentDragLeave);
    document.addEventListener("drop", handleDocumentDrop);

    return () => {
      document.removeEventListener("dragover", handleDocumentDragOver);
      document.removeEventListener("dragenter", handleDocumentDragEnter);
      document.removeEventListener("dragleave", handleDocumentDragLeave);
      document.removeEventListener("drop", handleDocumentDrop);
    };
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      parseFile(file);
    }
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target?.result;
      let parsedData: ImportData[] = [];

      if (file.name.endsWith(".csv")) {
        const csvText = data as string;
        const lines = csvText.split("\n");
        const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, "")).filter((h) => h !== "");
        setCsvHeaders(headers);
        const missingColumns = validateColumns(headers);
        setColumnErrors(missingColumns);

        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || "";
            });
            parsedData.push({
              unique_identifier: row["unique_identifier"] || "",
              openMic: row["Open Mic"] || "",
              venueName: row["Venue Name"] || "",
              borough: row["Borough"] || "",
              neighborhood: row["Neighborhood"] || "",
              day: row["Day"] || "",
              startTime: row["Start Time"] || "",
              stageTime: row["Stage time"] || "",
              cost: row["Cost"] || "",
              location: row["Location"] || "",
              lastVerified: row["Last verified"] || "",
              status: "pending",
            });
          }
        }
        setPreviewData(parsedData);
        setActiveTab("preview");
      }
    };

    reader.readAsText(file);
  };

  const validateData = () => {
    setIsValidating(true);
    const errors: { [key: string]: string[] } = {};
    const allErrors: string[] = [];

    const columnConsistencyErrors = validateColumnConsistency();
    if (columnConsistencyErrors.length > 0) {
      errors.columnConsistency = columnConsistencyErrors;
      allErrors.push(...columnConsistencyErrors);
    }

    const duplicateErrors = validateDuplicateUUIDs();
    if (duplicateErrors.length > 0) {
      errors.duplicateUUIDs = duplicateErrors;
      allErrors.push(...duplicateErrors);
    }

    setValidationErrors(errors);
    setValidationResults({
      isValid: allErrors.length === 0,
      errors: allErrors,
    });

    const status: ImportData['status'] =
      allErrors.length === 0 ? 'valid' : 'error';

    const updatedPreviewData = previewData.map((item) => ({
      ...item,
      status,
    }));
    setPreviewData(updatedPreviewData);
    setValidationResults({ isValid: allErrors.length === 0, errors: allErrors });
    setIsValidating(false);
  };

  const OPEN_MIC_FIELDS = [
    "Open Mic", "Day", "Start Time", "Latest End Time", "Venue Name", "Borough",
    "Neighborhood", "Location", "Venue type", "Cost", "Stage time", "Sign-Up Instructions",
    "Host(s) / Organizer", "Changes/updates", "Last verified", "SMS Response",
    "Manually verified", "Formerly verified", "SMS", "Other Rules",
    "Help other comics! Leave reviews", "unique_identifier"
  ];

  const validateColumnConsistency = (): string[] => {
    const errors: string[] = [];
    if (previewData.length === 0) return ["No data to validate"];
    if (csvHeaders.length === 0) return ["No CSV headers found for validation"];

    const missingColumns = OPEN_MIC_FIELDS.filter((field) => !csvHeaders.includes(field));
    const extraColumns = csvHeaders.filter((header) => !OPEN_MIC_FIELDS.includes(header));

    if (missingColumns.length > 0) errors.push(`Missing required columns: ${missingColumns.join(", ")}`);
    if (extraColumns.length > 0) errors.push(`Extra columns found: ${extraColumns.join(", ")}`);
    return errors;
  };

  const validateDuplicateUUIDs = (): string[] => {
    const errors: string[] = [];
    const uniqueIdentifiers = previewData.map((item) => item.unique_identifier);
    const duplicateUUIDs = uniqueIdentifiers.filter((uuid, index) => uniqueIdentifiers.indexOf(uuid) !== index);
    if (duplicateUUIDs.length > 0) {
      const uniqueDuplicates = [...new Set(duplicateUUIDs)];
      errors.push(`Duplicate unique_identifiers found: ${uniqueDuplicates.join(", ")}`);
    }
    return errors;
  };

  const validateColumns = (headers: string[]) => {
    return OPEN_MIC_FIELDS.filter((col) => !headers.some((header) => header.trim().toLowerCase() === col.toLowerCase()));
  };

  const importData = () => {
    setIsImporting(true);
    setTimeout(() => setIsImporting(false), 3000);
  };

  const getValidationStats = () => {
    const total = previewData.length;
    const valid = previewData.filter((item) => item.status === "valid").length;
    const errors = previewData.filter((item) => item.status === "error").length;
    const pending = previewData.filter((item) => item.status === "pending").length;
    return { total, valid, errors, pending };
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        "Open Mic": "Example Comedy Night",
        "Venue Name": "The Laugh Factory",
        "Borough": "Manhattan",
        "Neighborhood": "Chelsea",
        "Day": "Monday",
        "Start Time": "8:00 PM",
        "Stage Time": "5 minutes",
        "Cost": "Free",
        "Location": "123 Main St, New York, NY",
        "Last Verified": "2024-01-15"
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "open_mics_import_template.xlsx");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Import</h1>
          <p className="text-gray-600 mt-2">Import open mic data from CSV or Excel files</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2" onClick={downloadTemplate}>
          <Download className="h-4 w-4" />
          Download Template
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload" className="flex items-center gap-2 h-10">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2 h-10">
            <FileText className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="validate" className="flex items-center gap-2 h-10">
            <CheckCircle className="h-4 w-4" />
            Validate
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2 h-10">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6 relative">
          {isDragOver && (
            <div className="fixed inset-0 bg-black/60 transition-colors duration-300 z-[9998]" />
          )}
          
          <Card className="relative">
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
            </CardHeader>
                         <CardContent className="relative space-y-4">
                                <div 
                  className={`upload-area relative z-[9999] border-2 border-dashed rounded-lg p-8 text-center transition-border duration-200 ${
                    isDragOver 
                      ? 'border-blue-500 bg-gray-50 border-blue-500 shadow-lg' 
                      : 'border-gray-300'
                  }`}
                >
                <Upload className={`h-12 w-12 mx-auto mb-4 transition-colors duration-200 ${
                  isDragOver ? 'text-blue-500' : 'text-gray-400'
                }`} />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {isDragOver ? 'Drop your file here' : 'Upload your CSV or Excel file'}
                </p>
                <p className="text-gray-600 mb-4">Supported formats: .csv, .xlsx, .xls</p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button className="cursor-pointer" onClick={() => document.getElementById('file-upload')?.click()}>
                    Choose File
                  </Button>
                </label>
              </div>
              {uploadedFile && (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">{uploadedFile.name}</p>
                      <p className="text-sm text-green-600">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => setActiveTab("preview")}>
                    Continue to Preview
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <p className="text-sm text-gray-600">
                Review your data before validation and import
              </p>
            </CardHeader>
            <CardContent>
              {columnErrors.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="text-red-800 font-medium mb-2">Column Mapping Issues</h3>
                  <p className="text-red-700 text-sm mb-2">
                    The following required columns were not found in your file:
                  </p>
                  <ul className="text-red-700 text-sm list-disc list-inside">
                    {columnErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              {previewData.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Showing 10 of {previewData.length} records
                    </p>
                    <Button onClick={() => setActiveTab("validate")}>
                      Continue to Validation
                    </Button>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-max">
                        <thead className="bg-gray-50">
                          <tr>
                            {csvHeaders.map((header, index) => (
                              <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 whitespace-nowrap">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {previewData.slice(0, 10).map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              {csvHeaders.map((header, headerIndex) => (
                                <td key={headerIndex} className="px-4 py-2 text-sm whitespace-nowrap max-w-xs truncate">
                                  {item[header] || ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No data to preview. Please upload a file first.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validate" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Validation</CardTitle>
              <p className="text-sm text-gray-600">
                Validate your data for errors and inconsistencies
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {previewData.length > 0 ? (
                <>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{getValidationStats().total}</p>
                      <p className="text-sm text-blue-600">Total Records</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{getValidationStats().valid}</p>
                      <p className="text-sm text-green-600">Valid</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{getValidationStats().errors}</p>
                      <p className="text-sm text-red-600">Errors</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{getValidationStats().pending}</p>
                      <p className="text-sm text-yellow-600">Pending</p>
                    </div>
                  </div>
                  
                  {validationResults.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-red-800 mb-2">Validation Errors</h3>
                      <ul className="space-y-1">
                        {validationResults.errors.map((error, index) => (
                          <li key={index} className="text-red-700 text-sm">• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {validationResults.isValid && validationResults.errors.length === 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-green-800 mb-2">✓ Validation Passed</h3>
                      <p className="text-green-700 text-sm">All data has been validated successfully.</p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Button 
                      onClick={validateData} 
                      disabled={isValidating}
                      className="flex items-center gap-2"
                    >
                      {isValidating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Validating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Validate Data
                        </>
                      )}
                    </Button>
                    
                    {validationResults.isValid && getValidationStats().valid > 0 && (
                      <Button 
                        onClick={importData}
                        disabled={isImporting}
                        className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                      >
                        {isImporting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Importing...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Import to Database
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No data to validate. Please upload and preview data first.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Import History</CardTitle>
              <p className="text-sm text-gray-600">
                Track your previous imports and their status
              </p>
            </CardHeader>
            <CardContent>
              {importHistory.length > 0 ? (
                <div className="space-y-4">
                  {importHistory.map((import_, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{import_.filename}</p>
                        <p className="text-sm text-gray-600">
                          {import_.records} records • {import_.date}
                        </p>
                      </div>
                      <Badge variant={import_.status === 'success' ? 'default' : 'destructive'}>
                        {import_.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No import history yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BulkImportInterface;
