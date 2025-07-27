import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building, Printer, Search, RotateCcw } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface AdminUsersTabProps {
  users: any[];
  usersTabSearchTerm: string;
  setUsersTabSearchTerm: (v: string) => void;
  roleFilter: string;
  setRoleFilter: (v: string) => void;
  priceRange: [number, number];
  setPriceRange: (v: [number, number]) => void;
  priceRangeInputs: [string, string];
  setPriceRangeInputs: (v: [string, string]) => void;
  priceDistribution: any;
  filteredUsers: any[];
  formatPrice: (n: number) => string;
  dummyDB: any;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  users,
  usersTabSearchTerm,
  setUsersTabSearchTerm,
  roleFilter,
  setRoleFilter,
  priceRange,
  setPriceRange,
  priceRangeInputs,
  setPriceRangeInputs,
  priceDistribution,
  filteredUsers,
  formatPrice,
  dummyDB,
}) => {
  // Calculate intervals for quick range radio buttons
  const minValue = 0;
  const maxValue = Math.ceil(priceDistribution.max);
  // Ensure min value is always 0 on initial render
  React.useEffect(() => {
    if (priceRange[0] !== minValue || priceRange[1] !== maxValue) {
      setPriceRange([minValue, maxValue]);
      setPriceRangeInputs([
        minValue.toString(),
        maxValue.toString()
      ]);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const intervalSize = (maxValue - minValue) / 4;
  // Use rounded values for intervals
  const rawIntervals = [
    [minValue, minValue + intervalSize],
    [minValue + intervalSize, minValue + 2 * intervalSize],
    [minValue + 2 * intervalSize, minValue + 3 * intervalSize],
    [minValue + 3 * intervalSize, maxValue],
  ];
  // Round interval values to nearest euro
  const intervals = rawIntervals.map(([start, end], i) => [
    Math.round(i === 0 ? start : start + 0.01),
    Math.round(end)
  ]);
  const intervalLabels = intervals.map(([start, end], i) => {
    const formatEuro = (n: number) => `${n.toLocaleString('el-GR', { maximumFractionDigits: 0 })}€`;
    if (i === 0) return `Έως ${formatEuro(end)}`;
    if (i === 3) return `Από ${formatEuro(start)} και άνω`;
    return `${formatEuro(start)} - ${formatEuro(end)}`;
  });
  const intervalValues = intervals.map(([start, end]) => `${start}-${end}`);
  const intervalCounts = intervals.map(([start, end], i) =>
    users.filter((u) => {
      const printBilling = dummyDB.getPrintBilling(u.uid);
      const laminationBilling = dummyDB.getLaminationBilling(u.uid);
      const printUnpaid = printBilling.filter((b: any) => !b.paid).reduce((sum: number, b: any) => sum + b.remainingBalance, 0);
      const laminationUnpaid = laminationBilling.filter((b: any) => !b.paid).reduce((sum: number, b: any) => sum + b.remainingBalance, 0);
      const totalUnpaid = printUnpaid + laminationUnpaid;
      if (i === 0) return totalUnpaid <= end;
      if (i === 3) return totalUnpaid >= start;
      return totalUnpaid > start - 0.01 && totalUnpaid <= end;
    }).length
  );

  return (
    <div>
      {/* Filters UI */}
      <div className="mb-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch">
          <div className="flex-1 flex items-center">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Αναζήτηση χρηστών..."
                value={usersTabSearchTerm}
                onChange={(e) => setUsersTabSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-60 flex items-center">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Όλοι οι ρόλοι</SelectItem>
                <SelectItem value="Άτομο">Άτομο</SelectItem>
                <SelectItem value="Ομάδα">Ομάδα</SelectItem>
                <SelectItem value="Ναός">Ναός</SelectItem>
                <SelectItem value="Τομέας">Τομέας</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>
        <div className="w-full flex flex-col gap-2 mt-2">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col gap-4 min-h-[120px]">
            <div className="relative w-full mb-2" style={{ minHeight: '40px' }}>
              <label className="absolute left-0 top-1/2 -translate-y-1/2 font-semibold text-gray-700 text-sm whitespace-nowrap" style={{ zIndex: 1 }}>
                Φίλτρο Οφειλών
              </label>
              <div className="flex justify-center">
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    type="text"
                    aria-label="Ελάχιστο ποσό"
                    value={Math.round(Number(priceRangeInputs[0].replace(',', '.'))).toLocaleString('el-GR')}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9,.]/g, '').replace('.', ',')
                      val = val.replace(/(,.*),/, '$1')
                      setPriceRangeInputs([val, priceRangeInputs[1]])
                      const parsed = parseFloat(val.replace(',', '.')) || 0
                      setPriceRange([parsed, priceRange[1]])
                    }}
                    onFocus={e => e.target.select()}
                    className="w-24 h-9 text-sm border-gray-300 rounded-md text-center"
                    min={minValue}
                    max={priceRange[1]}
                  />
                  <span className="text-base">€</span>
                  <span className="mx-1 text-gray-400 text-lg">-</span>
                  <Input
                    type="text"
                    aria-label="Μέγιστο ποσό"
                    value={Math.round(Number(priceRangeInputs[1].replace(',', '.'))).toLocaleString('el-GR')}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9,.]/g, '').replace('.', ',')
                      val = val.replace(/(,.*),/, '$1')
                      setPriceRangeInputs([priceRangeInputs[0], val])
                      const parsed = parseFloat(val.replace(',', '.')) || 0
                      setPriceRange([priceRange[0], parsed])
                    }}
                    onFocus={e => e.target.select()}
                    className="w-24 h-9 text-sm border-gray-300 rounded-md text-center"
                    min={priceRange[0]}
                    max={maxValue}
                  />
                  <span className="text-base">€</span>
                </div>
              </div>
              <button
                type="button"
                aria-label="Επαναφορά φίλτρου"
                className="absolute right-0 top-1/2 -translate-y-1/2 ml-2 p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition"
                style={{ zIndex: 1 }}
                onClick={() => {
                  setPriceRange([minValue, maxValue]);
                  setPriceRangeInputs([
                    minValue.toString(),
                    maxValue.toString()
                  ]);
                }}
              >
                <RotateCcw className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-end justify-between h-16 mb-2 px-2">
                {/* Histogram bar distribution (fixed buckets, yellow color) */}
                {(() => {
                  const NUM_BUCKETS = 16;
                  const bucketSize = (priceDistribution.max - priceDistribution.min) / NUM_BUCKETS;
                  const buckets = Array.from({ length: NUM_BUCKETS }, (_, i) => {
                    const start = priceDistribution.min + i * bucketSize;
                    const end = start + bucketSize;
                    const count = users.filter((u) => {
                      const printBilling = dummyDB.getPrintBilling(u.uid);
                      const laminationBilling = dummyDB.getLaminationBilling(u.uid);
                      const printUnpaid = printBilling.filter((b: any) => !b.paid).reduce((sum: number, b: any) => sum + b.remainingBalance, 0);
                      const laminationUnpaid = laminationBilling.filter((b: any) => !b.paid).reduce((sum: number, b: any) => sum + b.remainingBalance, 0);
                      const totalUnpaid = printUnpaid + laminationUnpaid;
                      return totalUnpaid >= start && (i === NUM_BUCKETS - 1 ? totalUnpaid <= end : totalUnpaid < end);
                    }).length;
                    return { start, end, count };
                  });
                  const maxCount = Math.max(...buckets.map(b => b.count), 1);
                  return (
                    <React.Fragment>
                      {buckets.map((bucket, idx) => (
                        <div
                          key={idx}
                          className="bg-yellow-400"
                          style={{
                            width: '8px',
                            height: `${(bucket.count / maxCount) * 48}px`,
                            minHeight: '2px',
                            marginLeft: idx === 0 ? 0 : '2px',
                            marginRight: idx === buckets.length - 1 ? 0 : '2px',
                            borderRadius: 0,
                          }}
                        />
                      ))}
                    </React.Fragment>
                  );
                })()}
              </div>
              {/* 2-thumb slider for range selection */}
              <Slider
                value={priceRange}
                onValueChange={(value: number[]) => {
                  setPriceRange(value as [number, number]);
                  setPriceRangeInputs([
                    value[0].toFixed(2).replace('.', ','),
                    value[1].toFixed(2).replace('.', ',')
                  ]);
                }}
                min={minValue}
                max={maxValue}
                step={0.01}
                className="w-full"
                aria-label="Εύρος ποσού"
                trackClassName="bg-gray-200 h-1"
                rangeClassName="bg-yellow-400"
                thumbClassName="bg-yellow-400 border-yellow-500 h-4 w-4 border-2"
              />
              {/* Quick range radio buttons */}
              <RadioGroup
                value={`${priceRange[0]}-${priceRange[1]}`}
                onValueChange={(value: string) => {
                  const [min, max] = value.split('-').map((v: string) => parseFloat(v));
                  setPriceRange([min, max]);
                  setPriceRangeInputs([
                    min.toFixed(2).replace('.', ','),
                    max.toFixed(2).replace('.', ',')
                  ]);
                }}
                className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2"
                aria-label="Γρήγορη επιλογή εύρους"
              >
                {intervals.map(([start, end], i) => (
                  <div className="flex items-center" key={i}>
                    <RadioGroupItem value={`${start}-${end}`} id={`range-${i}`} className="sr-only" />
                    <Label htmlFor={`range-${i}`} className={`text-sm px-3 py-1 rounded-full border cursor-pointer transition ${priceRange[0] === start && priceRange[1] === end ? 'bg-yellow-100 border-yellow-400 text-yellow-800 font-semibold' : 'bg-white border-gray-300 text-gray-700'}`}>{intervalLabels[i]} ({intervalCounts[i]})</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </div>
      </div>
      <div className="text-sm text-gray-600 mb-4">
        Εμφανίζονται {filteredUsers.length} από {users.length} χρήστες
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredUsers.map((userData) => {
          const printBilling = dummyDB.getPrintBilling(userData.uid);
          const laminationBilling = dummyDB.getLaminationBilling(userData.uid);
          const printUnpaid = printBilling.filter((b: any) => !b.paid).reduce((sum: number, b: any) => sum + b.remainingBalance, 0);
          const laminationUnpaid = laminationBilling.filter((b: any) => !b.paid).reduce((sum: number, b: any) => sum + b.remainingBalance, 0);
          const totalUnpaid = printUnpaid + laminationUnpaid;
          return (
            <Card key={userData.uid} className="hover:shadow-lg transition-shadow flex flex-col h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {userData.displayName}
                  </div>
                  <Badge variant={userData.accessLevel === "admin" ? "default" : "secondary"}>
                    {userData.accessLevel === "admin" ? "Admin" : "User"}
                  </Badge>
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  {userData.department} • {userData.userRole}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 space-y-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Username:</span>
                    <span className="font-mono">{userData.username}</span>
                  </div>

                  {userData.responsiblePerson && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Υπεύθυνος:</span>
                      <span className="text-sm">{userData.responsiblePerson}</span>
                    </div>
                  )}
                </div>
                {userData.accessLevel === "user" && (
                  <div className="border-t pt-4 mt-auto">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Οφειλές</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">
                          <Printer className="h-3 w-3" /> Εκτυπώσεις:
                        </span>
                        <span className={printUnpaid > 0 ? "text-red-600 font-semibold" : "text-green-600"}>
                          {formatPrice(printUnpaid)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">
                          <Printer className="h-3 w-3" /> Πλαστικοποιήσεις:
                        </span>
                        <span className={laminationUnpaid > 0 ? "text-red-600 font-semibold" : "text-green-600"}>
                          {formatPrice(laminationUnpaid)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="font-medium">Σύνολο:</span>
                        <span className={totalUnpaid > 0 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                          {formatPrice(Math.round((printUnpaid + laminationUnpaid + Number.EPSILON) * 100) / 100)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}; 