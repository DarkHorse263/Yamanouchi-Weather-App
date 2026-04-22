import { Router, type IRouter } from "express";
import { GetBusServicesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const BUS_SERVICE_DATA = {
  provider: "Cooma Coaches - Snowy Mountains Bus Service",
  phone: "(02) 6452 1584",
  website: "https://www.coomacoaches.com.au",
  bookingInfo: "Bookings are recommended, especially during peak ski season (June-September). Book online or call to secure your seat.",
  routes: [
    {
      id: "canberra-cooma-jindabyne",
      name: "Canberra to Cooma & Jindabyne",
      description: "Daily service connecting Canberra with Cooma and Jindabyne, the gateway to the Snowy Mountains ski resorts.",
      stops: [
        "Canberra (Jolimont Centre)",
        "Queanbeyan",
        "Michelago",
        "Bredbo",
        "Cooma",
        "Berridale",
        "Jindabyne"
      ],
      schedule: [
        {
          departure: "07:15",
          arrival: "10:00",
          from: "Canberra (Jolimont Centre)",
          to: "Jindabyne",
          days: "Daily during ski season (June-October)",
          notes: "Morning service - connects with resort shuttles"
        },
        {
          departure: "14:30",
          arrival: "17:15",
          from: "Canberra (Jolimont Centre)",
          to: "Jindabyne",
          days: "Daily during ski season (June-October)",
          notes: "Afternoon service"
        },
        {
          departure: "08:00",
          arrival: "10:45",
          from: "Jindabyne",
          to: "Canberra (Jolimont Centre)",
          days: "Daily during ski season (June-October)",
          notes: "Morning return service"
        },
        {
          departure: "16:00",
          arrival: "18:45",
          from: "Jindabyne",
          to: "Canberra (Jolimont Centre)",
          days: "Daily during ski season (June-October)",
          notes: "Afternoon return service"
        }
      ],
      notes: "Additional services may operate on weekends and public holidays during peak season. Ski/snowboard gear can be carried in the luggage compartment.",
      seasonalInfo: "Winter ski season services run from the June long weekend through to early October, weather permitting. Off-season services operate on a reduced timetable - contact for details."
    },
    {
      id: "jindabyne-perisher",
      name: "Jindabyne to Perisher Valley",
      description: "Shuttle service from Jindabyne to Perisher ski resort, running throughout the ski season.",
      stops: [
        "Jindabyne (Town Centre)",
        "Jindabyne (various accommodation pickups)",
        "Ski Rider Hotel",
        "Smiggin Holes",
        "Perisher Valley"
      ],
      schedule: [
        {
          departure: "07:30",
          arrival: "08:15",
          from: "Jindabyne (Town Centre)",
          to: "Perisher Valley",
          days: "Daily during ski season",
          notes: "Morning ski shuttle - multiple pickup points in Jindabyne"
        },
        {
          departure: "08:30",
          arrival: "09:15",
          from: "Jindabyne (Town Centre)",
          to: "Perisher Valley",
          days: "Daily during ski season",
          notes: "Second morning shuttle"
        },
        {
          departure: "16:30",
          arrival: "17:15",
          from: "Perisher Valley",
          to: "Jindabyne (Town Centre)",
          days: "Daily during ski season",
          notes: "Afternoon return shuttle"
        },
        {
          departure: "17:30",
          arrival: "18:15",
          from: "Perisher Valley",
          to: "Jindabyne (Town Centre)",
          days: "Daily during ski season",
          notes: "Late afternoon return shuttle"
        }
      ],
      notes: "The Skitube (underground train) is an alternative way to reach Perisher from Bullocks Flat terminal. Bus passes and multi-trip tickets available.",
      seasonalInfo: "Service operates during the official ski season only, typically June long weekend to early October."
    },
    {
      id: "jindabyne-thredbo",
      name: "Jindabyne to Thredbo",
      description: "Daily shuttle service connecting Jindabyne with Thredbo Alpine Village via the Alpine Way.",
      stops: [
        "Jindabyne (Town Centre)",
        "Jindabyne (various accommodation pickups)",
        "Thredbo Alpine Village"
      ],
      schedule: [
        {
          departure: "07:45",
          arrival: "08:30",
          from: "Jindabyne (Town Centre)",
          to: "Thredbo Alpine Village",
          days: "Daily during ski season",
          notes: "Morning ski shuttle"
        },
        {
          departure: "09:00",
          arrival: "09:45",
          from: "Jindabyne (Town Centre)",
          to: "Thredbo Alpine Village",
          days: "Daily during ski season",
          notes: "Second morning shuttle"
        },
        {
          departure: "16:00",
          arrival: "16:45",
          from: "Thredbo Alpine Village",
          to: "Jindabyne (Town Centre)",
          days: "Daily during ski season",
          notes: "Afternoon return shuttle"
        },
        {
          departure: "17:00",
          arrival: "17:45",
          from: "Thredbo Alpine Village",
          to: "Jindabyne (Town Centre)",
          days: "Daily during ski season",
          notes: "Late afternoon return shuttle"
        }
      ],
      notes: "Thredbo is approximately 35km from Jindabyne via the Alpine Way. Chains may be required during heavy snowfall.",
      seasonalInfo: "Year-round service with increased frequency during ski season. Summer services operate for mountain biking and hiking access."
    },
    {
      id: "cooma-jindabyne-local",
      name: "Cooma to Jindabyne Local Service",
      description: "Regular local bus service connecting Cooma and Jindabyne for residents and visitors.",
      stops: [
        "Cooma (Sharp Street)",
        "Berridale",
        "Jindabyne (Town Centre)"
      ],
      schedule: [
        {
          departure: "08:30",
          arrival: "09:15",
          from: "Cooma (Sharp Street)",
          to: "Jindabyne (Town Centre)",
          days: "Monday to Friday",
          notes: "Weekday morning service"
        },
        {
          departure: "13:30",
          arrival: "14:15",
          from: "Cooma (Sharp Street)",
          to: "Jindabyne (Town Centre)",
          days: "Monday to Friday",
          notes: "Weekday afternoon service"
        },
        {
          departure: "10:00",
          arrival: "10:45",
          from: "Jindabyne (Town Centre)",
          to: "Cooma (Sharp Street)",
          days: "Monday to Friday",
          notes: "Weekday morning return"
        },
        {
          departure: "15:30",
          arrival: "16:15",
          from: "Jindabyne (Town Centre)",
          to: "Cooma (Sharp Street)",
          days: "Monday to Friday",
          notes: "Weekday afternoon return"
        }
      ],
      notes: "This service connects with NSW TrainLink services at Cooma for travel to/from Sydney and regional NSW.",
      seasonalInfo: "Year-round service. Additional weekend services during ski season."
    }
  ]
};

router.get("/bus-services", (_req, res) => {
  const result = GetBusServicesResponse.parse(BUS_SERVICE_DATA);
  res.json(result);
});

export default router;
