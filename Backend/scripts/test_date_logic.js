
const orders = [
    {
        closed_at: null,
        updatedAt: "2026-02-25T14:26:30Z",
        createdAt: "2026-02-25T12:02:57Z"
    }
];

const startDate = "2026-02-25";
const endDate = "2026-02-25";

const start = new Date(startDate); start.setHours(0, 0, 0, 0);
const end = new Date(endDate); end.setHours(23, 59, 59, 999);

console.log("Start:", start.toLocaleString());
console.log("End:", end.toLocaleString());

const filtered = orders.filter(o => {
    const fallbackDate = o.closed_at || o.updatedAt || o.createdAt;
    const date = new Date(fallbackDate);
    console.log("Order Date:", date.toLocaleString(), "Matched:", date >= start && date <= end);
    return date >= start && date <= end;
});

console.log("Filtered Length:", filtered.length);
