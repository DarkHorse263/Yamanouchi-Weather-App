import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            HomeView()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }

            ResortsView()
                .tabItem {
                    Label("Resorts", systemImage: "mountain.2.fill")
                }

            MapsView()
                .tabItem {
                    Label("Map", systemImage: "map.fill")
                }

            StormsView()
                .tabItem {
                    Label("Snow Outlook", systemImage: "cloud.snow.fill")
                }

            AlertsView()
                .tabItem {
                    Label("Alerts", systemImage: "bell.fill")
                }
        }
        .tint(.blue)
    }
}
