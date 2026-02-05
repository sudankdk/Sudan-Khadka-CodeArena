import { Icons } from '../../constants/Icons';

const StatsCard = () => {
  const data = [
    {
      type: "Total Users",
      value: "1,234",
      growth: "+12.5% this month",
      logo: <Icons.Users />,
    },
    {
      type: "Total Problems",
      value: "567",
      growth: "+8.3% this month",
      logo: <Icons.Problems />,
    },
    {
      type: "Active Contests",
      value: "89",
      growth: "+5.1% this month",
      logo: <Icons.Trophy />,
    },
  ];

  return (
    <div className="p-6 bg-white shadow rounded-lg ">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.map((item) => (
          <div
            key={item.type}
            className="flex items-center p-4 border rounded-lg transition-all hover:shadow-lg hover:scale-[1.02] hover:border-indigo-400"
          >
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full mr-4">
              {item.logo}
            </div>

            <div>
              <h3 className="text-lg font-semibold">{item.value}</h3>
              <p className="text-gray-500">{item.type}</p>

              <p
                className={`text-sm ${
                  item.growth.startsWith("+")
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {item.growth}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsCard;
