import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Truck, 
  FileSpreadsheet, 
  Scale, 
  Layers, 
  DollarSign, 
  X, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface TransportRecord {
  id: string; // Unique internal ID
  serialNo: string;
  vehicleNumber: string;
  numberOfBags: number;
  totalWeight: number;
  buyerAddress: string;
  rstNumber: string;
  billNumber: string;
  netAmount: number;
}

// Initial sample data for demonstration and easy testing
const SAMPLE_RECORDS: TransportRecord[] = [
  {
    id: '1',
    serialNo: 'S001',
    vehicleNumber: 'MH-12-PQ-8742',
    numberOfBags: 120,
    totalWeight: 6000,
    buyerAddress: '102 Industrial Area, Phase-I, Pune',
    rstNumber: 'RST-9082',
    billNumber: 'B-2026-001',
    netAmount: 180000
  },
  {
    id: '2',
    serialNo: 'S002',
    vehicleNumber: 'HR-55-AX-4321',
    numberOfBags: 250,
    totalWeight: 12500,
    buyerAddress: 'Warehouse 4, Plot 89, Sector 24, Gurgaon',
    rstNumber: 'RST-7741',
    billNumber: 'B-2026-002',
    netAmount: 375000
  },
  {
    id: '3',
    serialNo: 'S003',
    vehicleNumber: 'KA-03-MM-5566',
    numberOfBags: 80,
    totalWeight: 4000,
    buyerAddress: 'Outer Ring Road, Bellandur, Bangalore',
    rstNumber: 'RST-8109',
    billNumber: 'B-2026-003',
    netAmount: 120000
  },
  {
    id: '4',
    serialNo: 'S004',
    vehicleNumber: 'GJ-01-ZZ-9911',
    numberOfBags: 300,
    totalWeight: 15000,
    buyerAddress: 'GIDC Estate, Phase-II, Vatva, Ahmedabad',
    rstNumber: 'RST-6512',
    billNumber: 'B-2026-004',
    netAmount: 450000
  }
];

export default function App() {
  // Load initial data from localStorage, or use SAMPLE_RECORDS if empty
  const [records, setRecords] = useState<TransportRecord[]>(() => {
    const saved = localStorage.getItem('transport_records');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved records', e);
      }
    }
    return SAMPLE_RECORDS;
  });

  // Save to localStorage when records change
  useEffect(() => {
    localStorage.setItem('transport_records', JSON.stringify(records));
  }, [records]);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TransportRecord | null>(null);
  
  // Form fields state
  const [serialNo, setSerialNo] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [numberOfBags, setNumberOfBags] = useState('');
  const [totalWeight, setTotalWeight] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [rstNumber, setRstNumber] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [netAmount, setNetAmount] = useState('');

  // Validation errors state
  const [errors, setErrors] = useState<Partial<Record<keyof Omit<TransportRecord, 'id'>, string>>>({});

  // Search & Sorting & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof TransportRecord>('serialNo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Populate form for Editing
  const handleEditClick = (record: TransportRecord) => {
    setEditingRecord(record);
    setSerialNo(record.serialNo);
    setVehicleNumber(record.vehicleNumber);
    setNumberOfBags(record.numberOfBags.toString());
    setTotalWeight(record.totalWeight.toString());
    setBuyerAddress(record.buyerAddress);
    setRstNumber(record.rstNumber);
    setBillNumber(record.billNumber);
    setNetAmount(record.netAmount.toString());
    setErrors({});
    setIsModalOpen(true);
  };

  // Open Form for Adding New Record
  const handleAddClick = () => {
    setEditingRecord(null);
    // Auto-generate next serial number suggestion based on max numeric value of current ones
    let nextSerial = 'S001';
    if (records.length > 0) {
      const serials = records
        .map(r => parseInt(r.serialNo.replace(/\D/g, '')))
        .filter(n => !isNaN(n));
      if (serials.length > 0) {
        const nextNum = Math.max(...serials) + 1;
        nextSerial = `S${nextNum.toString().padStart(3, '0')}`;
      }
    }
    setSerialNo(nextSerial);
    setVehicleNumber('');
    setNumberOfBags('');
    setTotalWeight('');
    setBuyerAddress('');
    setRstNumber('');
    setBillNumber('');
    setNetAmount('');
    setErrors({});
    setIsModalOpen(true);
  };

  // Form Validation
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Omit<TransportRecord, 'id'>, string>> = {};

    if (!serialNo.trim()) newErrors.serialNo = 'Serial No is required';
    if (!vehicleNumber.trim()) newErrors.vehicleNumber = 'Vehicle Number is required';
    
    const bags = parseInt(numberOfBags);
    if (!numberOfBags.trim()) {
      newErrors.numberOfBags = 'Number of Bags is required';
    } else if (isNaN(bags) || bags <= 0) {
      newErrors.numberOfBags = 'Must be a positive number';
    }

    const weight = parseFloat(totalWeight);
    if (!totalWeight.trim()) {
      newErrors.totalWeight = 'Total Weight is required';
    } else if (isNaN(weight) || weight <= 0) {
      newErrors.totalWeight = 'Must be a positive number';
    }

    if (!buyerAddress.trim()) newErrors.buyerAddress = 'Buyer Address is required';
    if (!rstNumber.trim()) newErrors.rstNumber = 'RST Number is required';
    if (!billNumber.trim()) newErrors.billNumber = 'Bill Number is required';

    const amount = parseFloat(netAmount);
    if (!netAmount.trim()) {
      newErrors.netAmount = 'Net Amount is required';
    } else if (isNaN(amount) || amount <= 0) {
      newErrors.netAmount = 'Must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Form Submission (Add or Update)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const payload: TransportRecord = {
      id: editingRecord ? editingRecord.id : Date.now().toString(),
      serialNo: serialNo.trim(),
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      numberOfBags: parseInt(numberOfBags),
      totalWeight: parseFloat(totalWeight),
      buyerAddress: buyerAddress.trim(),
      rstNumber: rstNumber.trim(),
      billNumber: billNumber.trim(),
      netAmount: parseFloat(netAmount)
    };

    if (editingRecord) {
      // Update
      setRecords(records.map(r => r.id === editingRecord.id ? payload : r));
    } else {
      // Add
      setRecords([payload, ...records]);
    }

    setIsModalOpen(false);
    setEditingRecord(null);
  };

  // Handle Deletion
  const handleDeleteConfirm = () => {
    if (deleteConfirmId) {
      setRecords(records.filter(r => r.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      // Reset pagination if current page becomes empty
      const remainingFilteredCount = filteredRecords.length - 1;
      const totalPages = Math.ceil(remainingFilteredCount / itemsPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }
    }
  };

  // Sorting Handler
  const handleSort = (field: keyof TransportRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Excel Export Handler
  const handleExportToExcel = () => {
    // Reorder and format key names for the final spreadsheet
    const formattedData = records.map((r, index) => ({
      'S.No.': index + 1,
      'Serial Number': r.serialNo,
      'Vehicle Number': r.vehicleNumber,
      'Number of Bags': r.numberOfBags,
      'Total Weight (kg)': r.totalWeight,
      'Buyer Address': r.buyerAddress,
      'RST Number': r.rstNumber,
      'Bill Number': r.billNumber,
      'Net Amount ($)': r.netAmount
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    
    // Auto-fit column widths for better presentation
    const colWidths = Object.keys(formattedData[0] || {}).map(key => {
      let maxLen = key.length;
      formattedData.forEach(row => {
        const val = row[key as keyof typeof row];
        const valLen = val ? val.toString().length : 0;
        if (valLen > maxLen) maxLen = valLen;
      });
      return { wch: maxLen + 3 };
    });
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transport Log');
    
    // Generate filename with timestamp
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Transport_Billing_Log_${dateStr}.xlsx`);
  };

  // Filtered & Sorted Records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const term = searchTerm.toLowerCase();
      return (
        r.vehicleNumber.toLowerCase().includes(term) ||
        r.buyerAddress.toLowerCase().includes(term) ||
        r.billNumber.toLowerCase().includes(term) ||
        r.rstNumber.toLowerCase().includes(term) ||
        r.serialNo.toLowerCase().includes(term)
      );
    });
  }, [records, searchTerm]);

  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle numerical sort
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      // Handle string sort
      const strA = valA.toString().toLowerCase();
      const strB = valB.toString().toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortField, sortDirection]);

  // Paginated Records
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedRecords, currentPage]);

  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);

  // Statistics Calculation
  const stats = useMemo(() => {
    return records.reduce(
      (acc, curr) => {
        acc.bags += curr.numberOfBags;
        acc.weight += curr.totalWeight;
        acc.amount += curr.netAmount;
        return acc;
      },
      { bags: 0, weight: 0, amount: 0 }
    );
  }, [records]);

  // Reset page number on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-title-area">
          <h1>
            <Truck size={32} className="btn-action-edit" />
            Transport & Billing Dashboard
          </h1>
          <p>Manage, track, and export your cargo shipments and customer invoices.</p>
        </div>
        <div className="header-actions">
          <button onClick={handleExportToExcel} className="btn btn-secondary" title="Export current logs to Excel">
            <FileSpreadsheet size={18} />
            Export to Excel
          </button>
          <button onClick={handleAddClick} className="btn btn-primary">
            <Plus size={18} />
            Add Entry
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="stats-grid" aria-label="Summary Statistics">
        <div className="stat-card">
          <div className="stat-icon">
            <Layers size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Shipments</span>
            <span className="stat-value">{records.length}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Bags Loaded</span>
            <span className="stat-value">{stats.bags.toLocaleString()}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Scale size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Weight (kg)</span>
            <span className="stat-value">{stats.weight.toLocaleString()} kg</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Net Invoiced Amount</span>
            <span className="stat-value">${stats.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </section>

      {/* Main Dashboard Control & Grid */}
      <main className="dashboard-main">
        {/* Search Toolbar */}
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by Vehicle No, Buyer, Bill No, RST..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search records"
            />
          </div>
          <div className="toolbar-actions">
            {searchTerm && (
              <span className="badge badge-neutral">
                Found {sortedRecords.length} records
              </span>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="table-responsive">
          {paginatedRecords.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('serialNo')}>
                    Serial No {sortField === 'serialNo' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('vehicleNumber')}>
                    Vehicle No {sortField === 'vehicleNumber' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('numberOfBags')}>
                    Bags {sortField === 'numberOfBags' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('totalWeight')}>
                    Total Weight {sortField === 'totalWeight' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('buyerAddress')}>
                    Buyer Address {sortField === 'buyerAddress' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('rstNumber')}>
                    RST No {sortField === 'rstNumber' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('billNumber')}>
                    Bill No {sortField === 'billNumber' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('netAmount')}>
                    Net Amount {sortField === 'netAmount' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ cursor: 'default' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <span className="badge badge-neutral">{record.serialNo}</span>
                    </td>
                    <td style={{ fontWeight: '600', letterSpacing: '0.05em' }}>
                      {record.vehicleNumber}
                    </td>
                    <td>{record.numberOfBags.toLocaleString()}</td>
                    <td>{record.totalWeight.toLocaleString()} kg</td>
                    <td style={{ maxHeight: '3rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={record.buyerAddress}>
                      {record.buyerAddress}
                    </td>
                    <td>
                      <span className="badge badge-info">{record.rstNumber}</span>
                    </td>
                    <td>{record.billNumber}</td>
                    <td style={{ fontWeight: '600' }}>
                      ${record.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-action btn-action-edit"
                          onClick={() => handleEditClick(record)}
                          title="Edit Record"
                          aria-label={`Edit record ${record.serialNo}`}
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="btn-action btn-action-delete"
                          onClick={() => setDeleteConfirmId(record.id)}
                          title="Delete Record"
                          aria-label={`Delete record ${record.serialNo}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Search size={32} />
              </div>
              <h3>No shipments found</h3>
              <p>Try refining your search or add a new record to get started.</p>
              <button onClick={handleAddClick} className="btn btn-primary btn-sm">
                <Plus size={14} />
                Add Record
              </button>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <div>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedRecords.length)} of {sortedRecords.length} records
            </div>
            <div className="pagination-controls">
              <button 
                className="pagination-btn" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                aria-label="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                <button
                  key={pageNumber}
                  className={`pagination-btn ${currentPage === pageNumber ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNumber)}
                  aria-label={`Page ${pageNumber}`}
                >
                  {pageNumber}
                </button>
              ))}

              <button 
                className="pagination-btn" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                aria-label="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Add / Edit Record Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRecord ? 'Edit Shipment Record' : 'Add New Shipment'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)} aria-label="Close modal">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  {/* Serial No */}
                  <div className="form-group">
                    <label htmlFor="serialNo">Serial Number *</label>
                    <input 
                      type="text" 
                      id="serialNo"
                      value={serialNo}
                      onChange={(e) => setSerialNo(e.target.value)}
                      className={errors.serialNo ? 'invalid' : ''}
                      placeholder="e.g. S-101"
                    />
                    {errors.serialNo && <span className="error-msg">{errors.serialNo}</span>}
                  </div>

                  {/* Vehicle Number */}
                  <div className="form-group">
                    <label htmlFor="vehicleNumber">Vehicle Number *</label>
                    <input 
                      type="text" 
                      id="vehicleNumber"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      className={errors.vehicleNumber ? 'invalid' : ''}
                      placeholder="e.g. MH-12-PQ-8742"
                    />
                    {errors.vehicleNumber && <span className="error-msg">{errors.vehicleNumber}</span>}
                  </div>

                  {/* Number of Bags */}
                  <div className="form-group">
                    <label htmlFor="numberOfBags">Number of Bags *</label>
                    <input 
                      type="number" 
                      id="numberOfBags"
                      value={numberOfBags}
                      onChange={(e) => setNumberOfBags(e.target.value)}
                      className={errors.numberOfBags ? 'invalid' : ''}
                      placeholder="e.g. 150"
                      min="1"
                    />
                    {errors.numberOfBags && <span className="error-msg">{errors.numberOfBags}</span>}
                  </div>

                  {/* Total Weight */}
                  <div className="form-group">
                    <label htmlFor="totalWeight">Total Weight (kg) *</label>
                    <input 
                      type="number" 
                      id="totalWeight"
                      value={totalWeight}
                      onChange={(e) => setTotalWeight(e.target.value)}
                      className={errors.totalWeight ? 'invalid' : ''}
                      placeholder="e.g. 7500"
                      step="any"
                      min="0.1"
                    />
                    {errors.totalWeight && <span className="error-msg">{errors.totalWeight}</span>}
                  </div>

                  {/* RST Number */}
                  <div className="form-group">
                    <label htmlFor="rstNumber">RST Number *</label>
                    <input 
                      type="text" 
                      id="rstNumber"
                      value={rstNumber}
                      onChange={(e) => setRstNumber(e.target.value)}
                      className={errors.rstNumber ? 'invalid' : ''}
                      placeholder="e.g. RST-4451"
                    />
                    {errors.rstNumber && <span className="error-msg">{errors.rstNumber}</span>}
                  </div>

                  {/* Bill Number */}
                  <div className="form-group">
                    <label htmlFor="billNumber">Bill Number *</label>
                    <input 
                      type="text" 
                      id="billNumber"
                      value={billNumber}
                      onChange={(e) => setBillNumber(e.target.value)}
                      className={errors.billNumber ? 'invalid' : ''}
                      placeholder="e.g. B-2026-99"
                    />
                    {errors.billNumber && <span className="error-msg">{errors.billNumber}</span>}
                  </div>

                  {/* Net Amount */}
                  <div className="form-group">
                    <label htmlFor="netAmount">Net Amount ($) *</label>
                    <input 
                      type="number" 
                      id="netAmount"
                      value={netAmount}
                      onChange={(e) => setNetAmount(e.target.value)}
                      className={errors.netAmount ? 'invalid' : ''}
                      placeholder="e.g. 2400.00"
                      step="any"
                      min="0.01"
                    />
                    {errors.netAmount && <span className="error-msg">{errors.netAmount}</span>}
                  </div>

                  {/* Buyer Address */}
                  <div className="form-group form-group-full">
                    <label htmlFor="buyerAddress">Buyer Address *</label>
                    <textarea 
                      id="buyerAddress"
                      value={buyerAddress}
                      onChange={(e) => setBuyerAddress(e.target.value)}
                      className={errors.buyerAddress ? 'invalid' : ''}
                      placeholder="Enter the buyer's full shipping address..."
                      rows={3}
                    />
                    {errors.buyerAddress && <span className="error-msg">{errors.buyerAddress}</span>}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRecord ? 'Save Changes' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button className="close-btn" onClick={() => setDeleteConfirmId(null)} aria-label="Close modal">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ color: 'var(--danger)', padding: '0.25rem' }}>
                <AlertCircle size={28} />
              </div>
              <div>
                <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Are you sure you want to delete this shipment?</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>This action cannot be undone and will permanently remove the record from local storage.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setDeleteConfirmId(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} className="btn btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
