import React from "react";

const UserTable = ({ cols, data }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            {cols.map((col) => (
              <th
                key={col.key}
                className="px-4 py-2 text-left text-sm font-medium text-gray-700"
              >
                {col.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row, i) => (
            <tr
              key={i}
              className={
                i % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-gray-100"
              }
            >
              {cols.map((col) => (
                <td key={col.key} className="px-4 py-2 text-sm text-gray-600">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
