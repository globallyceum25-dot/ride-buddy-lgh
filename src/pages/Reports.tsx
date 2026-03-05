import { useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart3 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { VehicleReport } from '@/components/reports/VehicleReport';
import { DriverReport } from '@/components/reports/DriverReport';
import { LocationReport } from '@/components/reports/LocationReport';
import { DepartmentReport } from '@/components/reports/DepartmentReport';
import { HailingCostReport } from '@/components/reports/HailingCostReport';
import {
  useVehicleReport,
  useDriverReport,
  useLocationReport,
  useDepartmentReport,
  useHailingCostReport,
  ReportFilters as ReportFiltersType,
  type HailingCostReportData,
} from '@/hooks/useReportData';

export default function Reports() {
  const today = new Date();
  const [filters, setFilters] = useState<ReportFiltersType>({
    startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(today), 'yyyy-MM-dd'),
    tripType: 'all',
  });
  const [activeTab, setActiveTab] = useState('vehicle');

  const vehicleReport = useVehicleReport(filters);
  const driverReport = useDriverReport(filters);
  const locationReport = useLocationReport(filters);
  const departmentReport = useDepartmentReport(filters);
  const hailingCostReport = useHailingCostReport(filters);

  const handleExport = () => {
    let csvData = '';
    let filename = '';

    switch (activeTab) {
      case 'vehicle':
        if (vehicleReport.data) {
          csvData = generateVehicleCSV(vehicleReport.data);
          filename = `vehicle-report-${filters.startDate}-to-${filters.endDate}.csv`;
        }
        break;
      case 'driver':
        if (driverReport.data) {
          csvData = generateDriverCSV(driverReport.data);
          filename = `driver-report-${filters.startDate}-to-${filters.endDate}.csv`;
        }
        break;
      case 'location':
        if (locationReport.data) {
          csvData = generateLocationCSV(locationReport.data);
          filename = `location-report-${filters.startDate}-to-${filters.endDate}.csv`;
        }
        break;
      case 'department':
        if (departmentReport.data) {
          csvData = generateDepartmentCSV(departmentReport.data);
          filename = `department-report-${filters.startDate}-to-${filters.endDate}.csv`;
        }
        break;
      case 'hailing':
        if (hailingCostReport.data) {
          csvData = generateHailingCSV(hailingCostReport.data);
          filename = `hailing-cost-report-${filters.startDate}-to-${filters.endDate}.csv`;
        }
        break;
    }

    if (csvData && filename) {
      downloadCSV(csvData, filename);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Reports
            </h1>
            <p className="text-muted-foreground">
              Analyze fleet performance across vehicles, drivers, locations, and departments
            </p>
          </div>
        </div>

        {/* Filters */}
        <ReportFilters
          startDate={filters.startDate}
          endDate={filters.endDate}
          onStartDateChange={(date) => setFilters((f) => ({ ...f, startDate: date }))}
          onEndDateChange={(date) => setFilters((f) => ({ ...f, endDate: date }))}
          tripType={filters.tripType}
          onTripTypeChange={(value) => setFilters((f) => ({ ...f, tripType: value }))}
          onExport={handleExport}
        />

        {/* Report Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full overflow-x-auto flex-nowrap sm:grid sm:grid-cols-5 lg:w-[620px]">
            <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
            <TabsTrigger value="driver">Driver</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="department">Department</TabsTrigger>
            <TabsTrigger value="hailing">Hailing Costs</TabsTrigger>
          </TabsList>

          <TabsContent value="vehicle" className="mt-6">
            <VehicleReport data={vehicleReport.data} isLoading={vehicleReport.isLoading} />
          </TabsContent>

          <TabsContent value="driver" className="mt-6">
            <DriverReport data={driverReport.data} isLoading={driverReport.isLoading} />
          </TabsContent>

          <TabsContent value="location" className="mt-6">
            <LocationReport data={locationReport.data} isLoading={locationReport.isLoading} />
          </TabsContent>

          <TabsContent value="department" className="mt-6">
            <DepartmentReport data={departmentReport.data} isLoading={departmentReport.isLoading} />
          </TabsContent>

          <TabsContent value="hailing" className="mt-6">
            <HailingCostReport data={hailingCostReport.data} isLoading={hailingCostReport.isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// CSV Generation Helpers
function generateVehicleCSV(data: ReturnType<typeof useVehicleReport>['data']) {
  if (!data) return '';
  const headers = ['Vehicle', 'Make', 'Model', 'Total Trips', 'Completed', 'Cancelled', 'Distance (km)', 'Avg Passengers'];
  const rows = data.items.map((item) => [
    item.registrationNumber,
    item.make || '',
    item.model || '',
    item.totalTrips,
    item.completedTrips,
    item.cancelledTrips,
    item.totalDistance,
    item.avgPassengers.toFixed(1),
  ]);
  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

function generateDriverCSV(data: ReturnType<typeof useDriverReport>['data']) {
  if (!data) return '';
  const headers = ['Driver', 'License', 'Total Trips', 'Completed', 'Cancelled', 'Total Hours', 'Avg Duration'];
  const rows = data.items.map((item) => [
    item.driverName,
    item.licenseNumber,
    item.totalTrips,
    item.completedTrips,
    item.cancelledTrips,
    item.totalHours.toFixed(1),
    item.avgTripDuration.toFixed(1),
  ]);
  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

function generateLocationCSV(data: ReturnType<typeof useLocationReport>['data']) {
  if (!data) return '';
  const headers = ['Location', 'Code', 'As Origin', 'As Destination', 'Total Trips'];
  const rows = data.items.map((item) => [
    item.locationName,
    item.locationCode || '',
    item.tripsAsOrigin,
    item.tripsAsDestination,
    item.totalTrips,
  ]);
  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

function generateDepartmentCSV(data: ReturnType<typeof useDepartmentReport>['data']) {
  if (!data) return '';
  const headers = ['Department', 'Total Requests', 'Completed', 'Rejected', 'Pending', 'Total Passengers', 'Avg Passengers'];
  const rows = data.items.map((item) => [
    item.department,
    item.totalRequests,
    item.completedRequests,
    item.rejectedRequests,
    item.pendingRequests,
    item.totalPassengers,
    item.avgPassengers.toFixed(1),
  ]);
  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

function generateHailingCSV(data: HailingCostReportData) {
  const providerLabels: Record<string, string> = { pickme: 'PickMe', uber: 'Uber', personal: 'Personal' };
  const headers = ['Provider', 'Trips', 'Total Fare (LKR)', 'Avg Fare (LKR)', 'Receipts'];
  const rows = data.items.map((item) => [
    providerLabels[item.provider] || item.provider,
    item.tripCount,
    item.totalFare,
    Math.round(item.avgFare),
    item.receiptsCount,
  ]);
  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
