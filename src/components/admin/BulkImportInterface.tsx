import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, CheckCircle, AlertCircle, Download, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import * as XLSX from 'xlsx';

interface ImportData {
  id: string;
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
  status: 'pending' | 'valid' | 'error';
  errors?: string[];
}

const BulkImportInterface = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportData[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [columnErrors, setColumnErrors] = useState<string[]>([]);

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
      try {
        const data = e.target?.result;
        let parsedData: ImportData[] = [];

        if (file.name.endsWith('.csv')) {
          // Parse CSV
          const csvText = data as string;
          const lines = csvText.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          
          // Validate columns
          const missingColumns = validateColumns(headers);
          setColumnErrors(missingColumns);
          
          if (missingColumns.length > 0) {
            console.warn('Column validation failed:', missingColumns);
          }
          
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
              const row: any = {};
              
              headers.forEach((header, index) => {
                row[header] = values[index] || '';
              });
              
              parsedData.push({
                id: `temp-${i}`,
                openMic: getColumnValue(row, ['Open Mic', 'openMic', 'Open Mic Name', 'Mic Name']),
                venueName: getColumnValue(row, ['Venue Name', 'venueName', 'Venue', 'Venue Name']),
                borough: getColumnValue(row, ['Borough', 'borough']),
                neighborhood: getColumnValue(row, ['Neighborhood', 'neighborhood']),
                day: getColumnValue(row, ['Day', 'day']),
                startTime: getColumnValue(row, ['Start Time', 'startTime', 'Time']),
                stageTime: getColumnValue(row, ['Stage Time', 'stageTime', 'Stage time']),
                cost: getColumnValue(row, ['Cost', 'cost']),
                location: getColumnValue(row, ['Location', 'location']),
                lastVerified: getColumnValue(row, ['Last Verified', 'lastVerified', 'Last verified']),
                status: 'pending'
              });
            }
          }
        } else {
          // Parse Excel
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Validate columns for Excel
          const excelHeaders = Object.keys(jsonData[0] || {});
          const missingColumns = validateColumns(excelHeaders);
          setColumnErrors(missingColumns);
          
          parsedData = jsonData.map((row: any, index: number) => ({
            id: `temp-${index}`,
            openMic: getColumnValue(row, ['Open Mic', 'openMic', 'Open Mic Name', 'Mic Name']),
            venueName: getColumnValue(row, ['Venue Name', 'venueName', 'Venue', 'Venue Name']),
            borough: getColumnValue(row, ['Borough', 'borough']),
            neighborhood: getColumnValue(row, ['Neighborhood', 'neighborhood']),
            day: getColumnValue(row, ['Day', 'day']),
            startTime: getColumnValue(row, ['Start Time', 'startTime', 'Time']),
            stageTime: getColumnValue(row, ['Stage Time', 'stageTime', 'Stage time']),
            cost: getColumnValue(row, ['Cost', 'cost']),
            location: getColumnValue(row, ['Location', 'location']),
            lastVerified: getColumnValue(row, ['Last Verified', 'lastVerified', 'Last verified']),
            status: 'pending'
          }));
        }
        
        setPreviewData(parsedData);
        setActiveTab("preview");
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Error parsing file. Please check the file format.');
      }
    };
    
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const validateData = () => {
    setIsValidating(true);
    // TODO: Validate preview data
    setTimeout(() => setIsValidating(false), 2000);
  };

  const importData = () => {
    setIsImporting(true);
    // TODO: Import validated data to database
    setTimeout(() => setIsImporting(false), 3000);
  };

  const getValidationStats = () => {
    const total = previewData.length;
    const valid = previewData.filter(item => item.status === 'valid').length;
    const errors = previewData.filter(item => item.status === 'error').length;
    const pending = previewData.filter(item => item.status === 'pending').length;
    
    return { total, valid, errors, pending };
  };

  const validateColumns = (headers: string[]) => {
    const requiredColumns = ['Open Mic', 'Venue Name', 'Borough', 'Day', 'Start Time'];
    const missingColumns = requiredColumns.filter(col => 
      !headers.some(header => 
        header.trim().toLowerCase() === col.toLowerCase()
      )
    );
    
    if (missingColumns.length > 0) {
      console.warn('Missing columns:', missingColumns);
      console.log('Available columns:', headers);
    }
    
    return missingColumns;
  };

  const getColumnValue = (row: any, possibleNames: string[]) => {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== '') {
        return row[name];
      }
    }
    return '';
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Open Mic': 'Example Comedy Night',
        'Venue Name': 'The Laugh Factory',
        'Borough': 'Manhattan',
        'Neighborhood': 'Chelsea',
        'Day': 'Monday',
        'Start Time': '8:00 PM',
        'Stage Time': '5 minutes',
        'Cost': 'Free',
        'Location': '123 Main St, New York, NY',
        'Last Verified': '2024-01-15'
      },
      {
        'Open Mic': 'Open Mic Night',
        'Venue Name': 'Comedy Club',
        'Borough': 'Brooklyn',
        'Neighborhood': 'Williamsburg',
        'Day': 'Tuesday',
        'Start Time': '7:30 PM',
        'Stage Time': '3 minutes',
        'Cost': '$5',
        'Location': '456 Oak Ave, Brooklyn, NY',
        'Last Verified': '2024-01-16'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    
    // Auto-size columns
    const maxWidth = templateData.reduce((w, r) => Math.max(w, r['Open Mic'].length), 10);
    worksheet['!cols'] = [{ wch: maxWidth }];
    
    XLSX.writeFile(workbook, 'open_mics_import_template.xlsx');
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
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="validate" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Validate
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">Upload your CSV or Excel file</p>
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
                  <p className="text-red-700 text-sm mt-2">
                    Please check your CSV format or download the template for the correct column names.
                  </p>
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
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Open Mic</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Venue</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Borough</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Day</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {previewData.slice(0, 10).map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm">{item.openMic}</td>
                            <td className="px-4 py-2 text-sm">{item.venueName}</td>
                            <td className="px-4 py-2 text-sm">{item.borough}</td>
                            <td className="px-4 py-2 text-sm">{item.day}</td>
                            <td className="px-4 py-2 text-sm">{item.startTime}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                    
                    {getValidationStats().errors === 0 && getValidationStats().valid > 0 && (
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
