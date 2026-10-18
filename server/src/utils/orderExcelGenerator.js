import ExcelJS from 'exceljs';

/**
 * Formats a Date object into Indian Standard Time (IST) readable string.
 */
function formatIST(date) {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return String(date);
  }
}

/**
 * Generates an Excel workbook (.xlsx) for successful orders and payments.
 * Pipes directly to the express response stream.
 */
export async function generateOrdersExcel(orders, meta = {}, res) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Manju's Atelier";
  workbook.lastModifiedBy = "Manju's Atelier Admin";
  workbook.created = new Date();

  const brandBrown = 'FF825028';
  const brandGold = 'FFC19B6C';
  const lightZebra = 'FFFDFBF7';
  const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Segoe UI' };
  const cellFont = { size: 10, name: 'Segoe UI' };

  // ==========================================
  // SHEET 1: Orders & Payments Summary
  // ==========================================
  const ordersSheet = workbook.addWorksheet('Orders & Payments', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 2 }],
  });

  ordersSheet.columns = [
    { header: 'Order ID', key: 'orderId', width: 18 },
    { header: 'Order Date (IST)', key: 'date', width: 23 },
    { header: 'Payment Status', key: 'paymentStatus', width: 18 },
    { header: 'Payment Method', key: 'paymentMethod', width: 16 },
    { header: 'UTR / Txn Ref', key: 'utr', width: 20 },
    { header: 'Order Status', key: 'orderStatus', width: 15 },
    { header: 'Total Paid (₹)', key: 'total', width: 16 },
    { header: 'Subtotal (₹)', key: 'subtotal', width: 15 },
    { header: 'Discount (₹)', key: 'discount', width: 14 },
    { header: 'Coupon Code', key: 'couponCode', width: 16 },
    { header: 'Shipping Fee (₹)', key: 'shippingFee', width: 16 },
    { header: 'Items Qty', key: 'itemsQty', width: 12 },
    { header: 'Items Summary', key: 'itemsSummary', width: 36 },
    { header: 'Customer Name', key: 'customerName', width: 22 },
    { header: 'Customer Email', key: 'customerEmail', width: 26 },
    { header: 'Customer Phone', key: 'customerPhone', width: 16 },
    { header: 'Recipient Name', key: 'recipientName', width: 22 },
    { header: 'Shipping Phone', key: 'shippingPhone', width: 16 },
    { header: 'Address Line 1', key: 'line1', width: 28 },
    { header: 'Address Line 2', key: 'line2', width: 20 },
    { header: 'City', key: 'city', width: 16 },
    { header: 'State', key: 'state', width: 18 },
    { header: 'PIN Code', key: 'postalCode', width: 13 },
    { header: 'Country', key: 'country', width: 12 },
    { header: 'Delivered At', key: 'deliveredAt', width: 20 },
    { header: 'Return / Exchange', key: 'returnStatus', width: 20 },
  ];

  // Format header row
  const headerRow1 = ordersSheet.getRow(1);
  headerRow1.height = 30;
  headerRow1.eachCell((cell) => {
    cell.font = headerFont;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandBrown } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      bottom: { style: 'medium', color: { argb: brandGold } },
    };
  });

  let totalAmountSum = 0;
  let totalSubtotalSum = 0;
  let totalDiscountSum = 0;
  let totalItemsCount = 0;

  orders.forEach((o, index) => {
    const cust = typeof o.user === 'object' && o.user ? o.user : {};
    const ship = o.shippingAddress || {};
    const items = o.items || [];
    
    const itemsSummary = items
      .map((i) => `${i.quantity}x ${i.name || 'Product'}`)
      .join(', ');

    const totalQty = items.reduce((acc, curr) => acc + (curr.quantity || 0), 0);

    totalAmountSum += (o.total || 0);
    totalSubtotalSum += (o.subtotal || 0);
    totalDiscountSum += (o.discount || 0);
    totalItemsCount += totalQty;

    const row = ordersSheet.addRow({
      orderId: o.customOrderId || String(o._id),
      date: formatIST(o.createdAt),
      paymentStatus: o.paymentStatus || 'SUCCESSFUL',
      paymentMethod: o.paymentMethod || 'UPI',
      utr: o.utrNumber || '-',
      orderStatus: o.orderStatus || 'processing',
      total: o.total || 0,
      subtotal: o.subtotal || 0,
      discount: o.discount || 0,
      couponCode: o.couponCode || '-',
      shippingFee: o.shippingFee || 0,
      itemsQty: totalQty,
      itemsSummary: itemsSummary || '-',
      customerName: cust.name || ship.fullName || 'Customer',
      customerEmail: cust.email || '-',
      customerPhone: ship.phone || '-',
      recipientName: ship.fullName || cust.name || 'Customer',
      shippingPhone: ship.phone || '-',
      line1: ship.line1 || '-',
      line2: ship.line2 || '',
      city: ship.city || '-',
      state: ship.state || '-',
      postalCode: ship.postalCode || '-',
      country: ship.country || 'India',
      deliveredAt: formatIST(o.deliveredAt),
      returnStatus: o.returnExchange?.status ? `${o.returnExchange.actionType} (${o.returnExchange.status})` : '-',
    });

    row.height = 22;
    row.eachCell((cell, colNum) => {
      cell.font = cellFont;
      cell.alignment = { vertical: 'middle' };
      if (index % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightZebra } };
      }
      // Numeric currency formatting
      if ([7, 8, 9, 11].includes(colNum)) {
        cell.numFmt = '₹#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
      if ([1, 3, 4, 5, 6, 10, 12, 23].includes(colNum)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });
  });

  // Total summary row at the bottom of orders
  if (orders.length > 0) {
    const totalRow = ordersSheet.addRow({
      orderId: 'TOTAL',
      itemsQty: totalItemsCount,
      total: totalAmountSum,
      subtotal: totalSubtotalSum,
      discount: totalDiscountSum,
    });
    totalRow.height = 26;
    totalRow.eachCell((cell, colNum) => {
      cell.font = { bold: true, size: 11, name: 'Segoe UI', color: { argb: 'FF2D2015' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEADBBF' } };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'double' } };
      if ([7, 8, 9].includes(colNum)) {
        cell.numFmt = '₹#,##0.00';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
    });
  }

  // ==========================================
  // SHEET 2: Line Item Breakdown (GST & Inventory)
  // ==========================================
  const itemsSheet = workbook.addWorksheet('Itemized Products', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  itemsSheet.columns = [
    { header: 'Order ID', key: 'orderId', width: 18 },
    { header: 'Order Date (IST)', key: 'date', width: 23 },
    { header: 'Customer Name', key: 'customerName', width: 22 },
    { header: 'Product Name', key: 'productName', width: 36 },
    { header: 'Quantity', key: 'quantity', width: 12 },
    { header: 'Unit Price Paid (₹)', key: 'unitPrice', width: 18 },
    { header: 'Item Total (₹)', key: 'itemTotal', width: 18 },
    { header: 'Payment Status', key: 'paymentStatus', width: 18 },
    { header: 'Order Status', key: 'orderStatus', width: 15 },
  ];

  const headerRow2 = itemsSheet.getRow(1);
  headerRow2.height = 28;
  headerRow2.eachCell((cell) => {
    cell.font = headerFont;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5A381A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'medium', color: { argb: brandGold } } };
  });

  let itemRowIdx = 0;
  orders.forEach((o) => {
    const cust = typeof o.user === 'object' && o.user ? o.user : {};
    const ship = o.shippingAddress || {};
    const custName = cust.name || ship.fullName || 'Customer';

    (o.items || []).forEach((item) => {
      itemRowIdx++;
      const itemRow = itemsSheet.addRow({
        orderId: o.customOrderId || String(o._id),
        date: formatIST(o.createdAt),
        customerName: custName,
        productName: item.name || 'Handcrafted Craft Item',
        quantity: item.quantity || 1,
        unitPrice: item.price || 0,
        itemTotal: (item.price || 0) * (item.quantity || 1),
        paymentStatus: o.paymentStatus || 'SUCCESSFUL',
        orderStatus: o.orderStatus || 'processing',
      });

      itemRow.height = 20;
      itemRow.eachCell((cell, colNum) => {
        cell.font = cellFont;
        cell.alignment = { vertical: 'middle' };
        if (itemRowIdx % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightZebra } };
        }
        if ([5].includes(colNum)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
        if ([6, 7].includes(colNum)) {
          cell.numFmt = '₹#,##0.00';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        }
        if ([1, 8, 9].includes(colNum)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });
    });
  });

  // ==========================================
  // SHEET 3: Executive Summary & Audit
  // ==========================================
  const summarySheet = workbook.addWorksheet('Export Overview', {
    views: [{ showGridLines: true }],
  });

  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 28 },
    { header: 'Value', key: 'value', width: 40 },
  ];

  summarySheet.getRow(1).height = 26;
  summarySheet.getRow(1).eachCell((cell) => {
    cell.font = headerFont;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandBrown } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });

  const avgOrderVal = orders.length > 0 ? Math.round(totalAmountSum / orders.length) : 0;

  const summaryData = [
    { metric: 'Business Name', value: "Manju's Atelier" },
    { metric: 'Report Description', value: 'Successful Orders & Payments Report' },
    { metric: 'Selected Date Range Preset', value: meta.rangeLabel || 'All Time' },
    { metric: 'Date Range Covered', value: meta.dateRangeText || 'Full Catalog History' },
    { metric: 'Total Successful Orders', value: orders.length },
    { metric: 'Total Revenue Collected (₹)', value: `₹${totalAmountSum.toLocaleString('en-IN')}` },
    { metric: 'Total Craft Products Sold', value: totalItemsCount },
    { metric: 'Average Order Value (AOV)', value: `₹${avgOrderVal.toLocaleString('en-IN')}` },
    { metric: 'Total Discounts Given (₹)', value: `₹${totalDiscountSum.toLocaleString('en-IN')}` },
    { metric: 'Generated By (Admin)', value: meta.adminName || 'Admin' },
    { metric: 'Generated At (IST)', value: formatIST(new Date()) },
  ];

  summaryData.forEach((item, idx) => {
    const row = summarySheet.addRow(item);
    row.height = 22;
    row.eachCell((cell, colNum) => {
      cell.font = colNum === 1 ? { bold: true, size: 10, name: 'Segoe UI' } : cellFont;
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightZebra } };
      }
    });
  });

  // Write to response
  const filename = `manjus-atelier-successful-orders-${meta.rangeKey || 'export'}-${Date.now().toString(36)}.xlsx`;
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
}
