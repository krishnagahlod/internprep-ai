import os
import sys
import unittest
import asyncio

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from starlette.requests import Request
from routers import placement_analysis

class TestPlacementAnalytics(unittest.TestCase):
    def test_macro_trends_with_and_without_numpy(self):
        scope = {
            "type": "http",
            "path": "/placement-analysis/analytics/macro-trends",
            "headers": [],
            "client": ("127.0.0.1", 12345)
        }
        req = Request(scope)

        # 1. Run with numpy (if available)
        res_with_np = asyncio.run(placement_analysis.get_macro_placement_trends(req))
        self.assertEqual(res_with_np["status"], "success")
        self.assertIn("overview", res_with_np)
        self.assertGreater(res_with_np["overview"]["total_companies"], 0)
        self.assertGreater(res_with_np["overview"]["median_campus_ctc"], 0)
        self.assertGreater(len(res_with_np["sector_benchmarks"]), 0)

        # 2. Simulate complete absence of numpy (e.g. Render production environment without wheel)
        original_np = placement_analysis.np
        try:
            placement_analysis.np = None
            res_without_np = asyncio.run(placement_analysis.get_macro_placement_trends(req))
            self.assertEqual(res_without_np["status"], "success")
            
            # Exact numerical parity check between numpy and pure-Python interpolation
            self.assertEqual(
                res_with_np["overview"]["median_campus_ctc"],
                res_without_np["overview"]["median_campus_ctc"]
            )
            self.assertEqual(
                len(res_with_np["sector_benchmarks"]),
                len(res_without_np["sector_benchmarks"])
            )
            for b1, b2 in zip(res_with_np["sector_benchmarks"], res_without_np["sector_benchmarks"]):
                self.assertEqual(b1["median_ctc_inr"], b2["median_ctc_inr"])
                self.assertEqual(b1["p75_ctc_inr"], b2["p75_ctc_inr"])
                self.assertEqual(b1["p90_ctc_inr"], b2["p90_ctc_inr"])
                self.assertEqual(b1["median_inhand_inr"], b2["median_inhand_inr"])
        finally:
            placement_analysis.np = original_np

    def test_pure_python_stat_helpers(self):
        # Empty list resilience
        self.assertEqual(placement_analysis._calc_median([]), 0)
        self.assertEqual(placement_analysis._calc_percentile([], 75), 0)

        # Single element
        self.assertEqual(placement_analysis._calc_median([500000]), 500000)
        self.assertEqual(placement_analysis._calc_percentile([500000], 90), 500000)

        # Even number of elements
        self.assertEqual(placement_analysis._calc_median([10, 20, 30, 40]), 25)

        # Odd number of elements
        self.assertEqual(placement_analysis._calc_median([10, 20, 30]), 20)

if __name__ == "__main__":
    unittest.main()
