#include <iostream>
#include <vector>
#include <string>
#include <fstream>
#include <algorithm>
#include <iomanip>
#include <functional>
#include <stdexcept>
#include <limits>
#include <sstream>
#include <cstdlib>

// =========================================================================
// INISIALISASI NAMESPACE std DI AWAL PROGRAM
// =========================================================================
using namespace std;

// =========================================================================
// [4] NAMESPACE: Bungkus fungsi logika utama dalam namespace khusus
// =========================================================================
namespace CanteenSystem {

    // =========================================================================
    // [1] STRUCT: Definisikan entitas objek utama
    // =========================================================================
    struct Menu {
        int id;
        string name;
        double price;
        int stock;
        int stallId; // 1, 2, atau 3 (Mewakili Ibu Kantin 1, 2, 3)
    };

    struct Order {
        string itemName;
        int quantity;
        double pricePerUnit;
        double totalCost;
        int stallId; // Tambahan field untuk melacak asal stall Ibu Kantin (1, 2, atau 3)
    };

    // Nama file database lokal
    const string DB_FILE = "menu_database.txt";

    // =========================================================================
    // [6] INLINE FUNCTION: Optimalisasi compiler untuk fungsi pendek
    // =========================================================================
    inline void printLine(char ch = '=', int len = 65) {
        cout << string(len, ch) << endl;
    }

    inline void clearScreen() {
#ifdef _WIN32
        system("cls");
#else
        system("clear");
#endif
    }

    inline void displayHeader(const string& title) {
        printLine('=', 65);
        int pad = (65 - (int)title.length()) / 2;
        if (pad > 0) cout << string(pad, ' ');
        cout << title << endl;
        printLine('=', 65);
    }

    // =========================================================================
    // [7] FUNCTION TEMPLATE: Menerima input secara aman untuk berbagai tipe data
    // =========================================================================
    template <typename T>
    T getValidInput(const string& prompt) {
        T value;
        cout << prompt;
        if (!(cin >> value)) {
            cin.clear(); // Bersihkan error state
            cin.ignore(numeric_limits<streamsize>::max(), '\n'); // Hiraukan buffer sisa
            
            // [8] EXCEPTION HANDLING: Lempar exception tipe data tidak cocok
            throw invalid_argument("Format input tidak valid! Masukkan data sesuai format yang benar.");
        }
        return value;
    }

    // Pendamping input teks yang mengandung spasi
    string getLineInput(const string& prompt) {
        string value;
        cout << prompt;
        getline(cin >> ws, value);
        if (value.empty()) {
            throw invalid_argument("Input teks tidak boleh kosong!");
        }
        return value;
    }

    // =========================================================================
    // [2] REFERENCES (&): Parameter dengan reference untuk efisiensi memory
    // [10] FILE HANDLING: Menyimpan (menulis) database ke file eksternal (ofstream)
    // =========================================================================
    void saveMenuToFile(const vector<Menu>& menus) {
        ofstream outFile(DB_FILE);
        if (!outFile.is_open()) {
            throw runtime_error("Gagal membuka file database menu untuk menulis data!");
        }
        for (const auto& item : menus) {
            // Simpan berformat dengan delimiter '|'
            outFile << item.id << "|" << item.name << "|" << item.price << "|" << item.stock << "|" << item.stallId << "\n";
        }
        outFile.close();
    }

    // =========================================================================
    // [10] FILE HANDLING: Membaca data dari file eksternal (ifstream)
    // =========================================================================
    vector<Menu> loadMenuFromFile() {
        vector<Menu> menus;
        ifstream inFile(DB_FILE);
        
        if (!inFile.is_open()) {
            // Jika file database tidak ditemukan, buat menu default awal (Seeding)
            menus = {
                {101, "Nasi Goreng Kantin 1", 15000, 10, 1},
                {102, "Mie Goreng Spesial", 12000, 15, 1},
                {103, "Nasi Putih Anget", 4000, 30, 1},
                {201, "Ayam Geprek Bawang", 18000, 8, 2},
                {202, "Ayam Bakar Madu", 20000, 5, 2},
                {203, "Tahu Goreng Penyet", 2000, 20, 2},
                {301, "Es Teh Manis Jumbo", 4000, 50, 3},
                {302, "Jus Alpukat Creamy", 10000, 12, 3},
                {303, "Es Jeruk Segar", 5000, 15, 3}
            };
            saveMenuToFile(menus);
            return menus;
        }

        string line;
        while (getline(inFile, line)) {
            if (line.empty()) continue;
            stringstream ss(line);
            string idStr, name, priceStr, stockStr, stallIdStr;
            
            getline(ss, idStr, '|');
            getline(ss, name, '|');
            getline(ss, priceStr, '|');
            getline(ss, stockStr, '|');
            getline(ss, stallIdStr, '|');
            
            Menu m;
            m.id = stoi(idStr);
            m.name = name;
            m.price = stod(priceStr);
            m.stock = stoi(stockStr);
            m.stallId = stoi(stallIdStr);
            
            menus.push_back(m);
        }
        inFile.close();
        return menus;
    }

    // =========================================================================
    // [7] FUNCTION OVERLOADING: Dua fungsi bernama sama dengan tipe parameter beda
    // [3] POINTER (*): Mengembalikan pointer ke elemen vector untuk modifikasi data
    // =========================================================================
    
    // Versi 1: Mencari menu berdasarkan ID angka
    Menu* findMenu(vector<Menu>& menus, int id) {
        // [9] ITERATOR: Menggunakan iterator STL untuk menelusuri vector
        for (vector<Menu>::iterator it = menus.begin(); it != menus.end(); ++it) {
            if (it->id == id) {
                return &(*it); // Mengembalikan pointer alamat memori struct tersebut
            }
        }
        return nullptr;
    }

    // Versi 2: Mencari menu berdasarkan nama teks (Exact Match)
    Menu* findMenu(vector<Menu>& menus, const string& name) {
        // [9] ITERATOR
        for (vector<Menu>::iterator it = menus.begin(); it != menus.end(); ++it) {
            if (it->name == name) {
                return &(*it); // Mengembalikan pointer alamat memori
            }
        }
        return nullptr;
    }

    // Fungsi utilitas cetak menu (menggunakan parameter Reference)
    void displayMenus(const vector<Menu>& menuList) {
        cout << "+" << string(63, '-') << "+" << endl;
        cout << "| " << left << setw(6) << "ID"
             << "| " << setw(28) << "Nama Menu"
             << "| " << setw(12) << "Harga"
             << "| " << setw(8) << "Stok" << " |" << endl;
        cout << "+" << string(63, '-') << "+" << endl;

        for (const auto& item : menuList) {
            cout << "| " << left << setw(6) << item.id
                 << "| " << setw(28) << item.name
                 << "| Rp " << right << setw(8) << fixed << setprecision(0) << item.price << " "
                 << "| " << right << setw(6) << item.stock << "  |" << endl;
        }
        cout << "+" << string(63, '-') << "+" << endl;
    }

    // =========================================================================
    // [5] CALLBACK FUNCTION: Fungsi menerima fungsi pemrosesan (function)
    // =========================================================================
    void iterateCart(const vector<Order>& cart, function<void(const Order&)> callback) {
        // [9] ITERATOR: Menggunakan iterator const untuk traverse cart belanja
        for (vector<Order>::const_iterator it = cart.cbegin(); it != cart.cend(); ++it) {
            callback(*it); // Jalankan callback untuk tiap order
        }
    }

    // =========================================================================
    // [6] DEFAULT ARGUMENT: Memberikan nilai standar awal untuk parameter
    // =========================================================================
    void printReceipt(const vector<Order>& cart, double discount = 0.0, double taxRate = 0.10) {
        displayHeader("STRUK PEMESANAN MAKANAN KANTIN");
        
        double totalCost = 0.0;
        
        cout << "+" << string(63, '-') << "+" << endl;
        cout << "| " << left << setw(25) << "Nama Makanan/Minuman"
             << "| " << setw(8) << "Jumlah"
             << "| " << setw(12) << "Harga Satuan"
             << "| " << setw(12) << "Total" << " |" << endl;
        cout << "+" << string(63, '-') << "+" << endl;

        // [11] LAMBDA EXPRESSION: Dilewatkan langsung sebagai Callback formatter
        iterateCart(cart, [&totalCost](const Order& item) {
            cout << "| " << left << setw(25) << item.itemName
                 << "| " << right << setw(6) << item.quantity << " "
                 << "| Rp " << setw(8) << fixed << setprecision(0) << item.pricePerUnit << " "
                 << "| Rp " << setw(8) << item.totalCost << " |" << endl;
            totalCost += item.totalCost;
        });
        
        cout << "+" << string(63, '-') << "+" << endl;
        
        double tax = totalCost * taxRate;
        double finalTotal = totalCost - discount + tax;

        cout << right;
        cout << "| " << setw(45) << "Subtotal:" << " Rp " << setw(12) << totalCost << " |" << endl;
        if (discount > 0) {
            cout << "| " << setw(45) << "Diskon Promo:" << " -Rp" << setw(12) << discount << " |" << endl;
        }
        cout << "| " << setw(45) << "Pajak PPN (10%):" << " Rp " << setw(12) << tax << " |" << endl;
        cout << "+" << string(63, '-') << "+" << endl;
        cout << "| " << setw(45) << "TOTAL BAYAR:" << " Rp " << setw(12) << finalTotal << " |" << endl;
        cout << "+" << string(63, '-') << "+" << endl;
        cout << "\n* Terima kasih sudah berbelanja di Kantin Sekolah/Kampus! *\n\n";

        // =========================================================================
        // [10] FILE HANDLING: PEMISAHAN FILE RECEIPTS SESUAI IBU KANTIN (1, 2, atau 3)
        // =========================================================================
        for (int s = 1; s <= 3; ++s) {
            vector<Order> stallOrders;
            double stallSubtotal = 0.0;
            
            // Cari item belanja yang berasal dari stall ke-s
            for (const auto& item : cart) {
                if (item.stallId == s) {
                    stallOrders.push_back(item);
                    stallSubtotal += item.totalCost;
                }
            }

            // Jika ada belanjaan dari stall s ini, tulis struk pengantaran untuk Ibu Kantin tersebut
            if (!stallOrders.empty()) {
                string fileName = "receipts_kantin_" + to_string(s) + ".txt";
                ofstream recFile(fileName, ios::app);
                if (recFile.is_open()) {
                    recFile << "==========================================\n";
                    recFile << "--- STRUK PESANAN UNTUK IBU KANTIN " << s << " ---\n";
                    recFile << "==========================================\n";
                    for (const auto& item : stallOrders) {
                        recFile << " - " << item.itemName << " x " << item.quantity 
                                << " @ Rp " << fixed << setprecision(0) << item.pricePerUnit 
                                << " = Rp " << item.totalCost << "\n";
                    }
                    recFile << "Subtotal Belanja Stall " << s << ": Rp " << stallSubtotal << "\n";
                    recFile << "------------------------------------------\n\n";
                    recFile.close();
                }
            }
        }
    }

    // Menu Alur Pengelolaan Ibu Kantin (Role Owner)
    void handleIbuKantin(vector<Menu>& menus) {
        while (true) {
            clearScreen();
            displayHeader("PANEL PENGELOLA KANTIN (IBU KANTIN)");
            cout << "Pilih Stall Kantin Anda:\n";
            cout << "1. Ibu Kantin 1 (Makanan Utama)\n";
            cout << "2. Ibu Kantin 2 (Ayam & Gorengan)\n";
            cout << "3. Ibu Kantin 3 (Minuman & Jus)\n";
            cout << "4. Kembali ke Menu Utama\n";
            printLine('-', 65);

            int stallChoice = 0;
            try {
                // Gunakan Template Input
                stallChoice = getValidInput<int>("Masukkan Pilihan Stall (1-4): ");
                if (stallChoice < 1 || stallChoice > 4) {
                    throw out_of_range("Pilihan harus berkisar antara 1 sampai 4!");
                }
            } catch (const exception& e) {
                cout << "\nError: " << e.what() << "\nTekan Enter untuk melanjutkan...";
                cin.ignore(numeric_limits<streamsize>::max(), '\n');
                cin.get();
                continue;
            }

            if (stallChoice == 4) break;

            while (true) {
                clearScreen();
                string stallName = "Stall Ibu Kantin " + to_string(stallChoice);
                displayHeader("PENGELOLAAN - " + stallName);
                cout << "Menu Pengelolaan:\n";
                cout << "1. Lihat Daftar Menu Stall\n";
                cout << "2. Tambah Menu Baru\n";
                cout << "3. Hapus Menu Lama\n";
                cout << "4. Update Stok & Harga Menu\n";
                cout << "5. Kembali ke Pilihan Stall\n";
                printLine('-', 65);

                int actionChoice = 0;
                try {
                    actionChoice = getValidInput<int>("Masukkan Pilihan (1-5): ");
                    if (actionChoice < 1 || actionChoice > 5) {
                        throw out_of_range("Pilihan menu harus berkisar antara 1 sampai 5!");
                    }
                } catch (const exception& e) {
                    cout << "\nError: " << e.what() << "\nTekan Enter untuk melanjutkan...";
                    cin.ignore(numeric_limits<streamsize>::max(), '\n');
                    cin.get();
                    continue;
                }

                if (actionChoice == 5) break;

                try {
                    // 1. LIHAT DAFTAR MENU
                    if (actionChoice == 1) {
                        clearScreen();
                        displayHeader("DAFTAR MENU - " + stallName);

                        vector<Menu> stallMenus;
                        for (auto it = menus.begin(); it != menus.end(); ++it) {
                            if (it->stallId == stallChoice) {
                                stallMenus.push_back(*it);
                            }
                        }

                        // [9] STL ALGORITHM (count_if): Menghitung jumlah item pada stall terpilih
                        int itemCount = count_if(menus.begin(), menus.end(), [stallChoice](const Menu& m) {
                            return m.stallId == stallChoice;
                        });

                        cout << "Jumlah jenis menu yang terdaftar saat ini: " << itemCount << "\n\n";

                        if (stallMenus.empty()) {
                            cout << "Tidak ada item menu di stall ini. Silakan tambah menu baru!\n";
                        } else {
                            // [9] STL ALGORITHM (sort): Sortir berdasarkan ID Ascending menggunakan lambda
                            sort(stallMenus.begin(), stallMenus.end(), [](const Menu& a, const Menu& b) {
                                return a.id < b.id;
                            });
                            displayMenus(stallMenus);
                        }
                        cout << "\nTekan Enter untuk kembali...";
                        cin.ignore(numeric_limits<streamsize>::max(), '\n');
                        cin.get();
                    }
                    // 2. TAMBAH MENU BARU
                    else if (actionChoice == 2) {
                        clearScreen();
                        displayHeader("TAMBAH MENU BARU - " + stallName);

                        int newId = getValidInput<int>("Masukkan ID Menu Baru (Angka unik): ");
                        
                        // Validasi keunikan ID dengan Overloading findMenu
                        if (findMenu(menus, newId) != nullptr) {
                            throw invalid_argument("Gagal: ID Menu ini sudah terpakai!");
                        }

                        string newName = getLineInput("Masukkan Nama Makanan/Minuman: ");
                        
                        // Validasi keunikan nama
                        if (findMenu(menus, newName) != nullptr) {
                            throw invalid_argument("Gagal: Nama menu ini sudah terdaftar!");
                        }

                        double newPrice = getValidInput<double>("Masukkan Harga Menu (Rp): ");
                        if (newPrice < 0) {
                            throw invalid_argument("Gagal: Harga tidak boleh bernilai negatif!");
                        }

                        int newStock = getValidInput<int>("Masukkan Jumlah Stok Awal: ");
                        if (newStock < 0) {
                            throw invalid_argument("Gagal: Stok tidak boleh bernilai negatif!");
                        }

                        // Buat Struct baru dan push_back
                        Menu newItem = { newId, newName, newPrice, newStock, stallChoice };
                        menus.push_back(newItem);

                        // Simpan ke database file
                        saveMenuToFile(menus);

                        cout << "\nSukses: Menu \"" << newName << "\" berhasil terdaftar ke sistem!\n";
                        cout << "\nTekan Enter untuk melanjutkan...";
                        cin.ignore(numeric_limits<streamsize>::max(), '\n');
                        cin.get();
                    }
                    // 3. HAPUS MENU LAMA
                    else if (actionChoice == 3) {
                        clearScreen();
                        displayHeader("HAPUS MENU LAMA - " + stallName);
                        
                        vector<Menu> stallMenus;
                        for (const auto& item : menus) {
                            if (item.stallId == stallChoice) stallMenus.push_back(item);
                        }
                        
                        if (stallMenus.empty()) {
                            cout << "Belum ada menu di stall ini yang dapat dihapus.\n";
                            cout << "\nTekan Enter untuk kembali...";
                            cin.ignore(numeric_limits<streamsize>::max(), '\n');
                            cin.get();
                            continue;
                        }
                        
                        displayMenus(stallMenus);
                        
                        int deleteId = getValidInput<int>("\nMasukkan ID Menu yang akan dihapus: ");
                        
                        // [9] STL ALGORITHM (find_if) dengan Lambda Expression [11]
                        auto it = find_if(menus.begin(), menus.end(), [deleteId, stallChoice](const Menu& m) {
                            return m.id == deleteId && m.stallId == stallChoice;
                        });

                        if (it == menus.end()) {
                            throw out_of_range("Gagal: Menu tidak ditemukan di stall ini!");
                        }

                        string removedName = it->name;
                        menus.erase(it); // Hapus elemen dari vector

                        // Update database file
                        saveMenuToFile(menus);

                        cout << "\nSukses: Menu \"" << removedName << "\" berhasil dihapus secara permanen!\n";
                        cout << "\nTekan Enter untuk melanjutkan...";
                        cin.ignore(numeric_limits<streamsize>::max(), '\n');
                        cin.get();
                    }
                    // 4. UPDATE STOK & HARGA MENU
                    else if (actionChoice == 4) {
                        clearScreen();
                        displayHeader("UPDATE MENU - " + stallName);

                        vector<Menu> stallMenus;
                        for (const auto& item : menus) {
                            if (item.stallId == stallChoice) stallMenus.push_back(item);
                        }
                        
                        if (stallMenus.empty()) {
                            cout << "Belum ada menu di stall ini untuk di-update.\n";
                            cout << "\nTekan Enter untuk kembali...";
                            cin.ignore(numeric_limits<streamsize>::max(), '\n');
                            cin.get();
                            continue;
                        }
                        
                        displayMenus(stallMenus);

                        int updateId = getValidInput<int>("\nMasukkan ID Menu yang ingin diupdate: ");
                        
                        // [3] POINTER (*): Manipulasi data master menu secara langsung menggunakan pointer
                        Menu* itemPtr = findMenu(menus, updateId);
                        
                        if (itemPtr == nullptr || itemPtr->stallId != stallChoice) {
                            throw out_of_range("Gagal: Menu tidak ditemukan di stall ini!");
                        }

                        cout << "\nMenu Ditemukan: " << itemPtr->name << "\n";
                        double updatedPrice = getValidInput<double>("Masukkan Harga Baru (Rp): ");
                        if (updatedPrice < 0) {
                            throw invalid_argument("Gagal: Harga tidak boleh bernilai negatif!");
                        }

                        int updatedStock = getValidInput<int>("Masukkan Stok Baru: ");
                        if (updatedStock < 0) {
                            throw invalid_argument("Gagal: Stok tidak boleh bernilai negatif!");
                        }

                        // Mengubah data melalui pointer dereferencing implisit
                        itemPtr->price = updatedPrice;
                        itemPtr->stock = updatedStock;

                        // Simpan ke database file
                        saveMenuToFile(menus);

                        cout << "\nSukses: Menu \"" << itemPtr->name << "\" berhasil diperbarui!\n";
                        cout << "\nTekan Enter untuk melanjutkan...";
                        cin.ignore(numeric_limits<streamsize>::max(), '\n');
                        cin.get();
                    }
                } catch (const exception& e) {
                    cout << "\nError Operasi: " << e.what() << "\nTekan Enter untuk mencoba kembali...";
                    cin.ignore(numeric_limits<streamsize>::max(), '\n');
                    cin.get();
                }
            }
        }
    }

    // Menu Alur Transaksi Pembeli (Role Buyer)
    void handlePembeli(vector<Menu>& menus) {
        vector<Order> cart; // Menyimpan keranjang belanja sementara

        while (true) {
            clearScreen();
            displayHeader("PANEL PEMBELI (PESAN MAKANAN KANTIN)");
            cout << "Silakan Pilih Stall Ibu Kantin:\n";
            cout << "1. Ibu Kantin 1 (Makanan Utama)\n";
            cout << "2. Ibu Kantin 2 (Ayam & Gorengan)\n";
            cout << "3. Ibu Kantin 3 (Minuman & Jus)\n";
            cout << "4. Selesaikan Pemesanan & Cetak Struk (Check out)\n";
            cout << "5. Batalkan Semua & Kembali ke Menu Utama\n";
            printLine('-', 65);

            if (!cart.empty()) {
                cout << "Isi Keranjang Anda Saat Ini:\n";
                for (const auto& item : cart) {
                    cout << " * " << item.itemName << " [Porsi: " << item.quantity << "] = Rp " << item.totalCost << " (Stall " << item.stallId << ")\n";
                }
                printLine('-', 65);
            }

            int stallChoice = 0;
            try {
                stallChoice = getValidInput<int>("Masukkan Pilihan Peran/Stall (1-5): ");
                if (stallChoice < 1 || stallChoice > 5) {
                    throw out_of_range("Pilihan salah! Masukkan angka antara 1 sampai 5.");
                }
            } catch (const exception& e) {
                cout << "\nError: " << e.what() << "\nTekan Enter untuk melanjutkan...";
                cin.ignore(numeric_limits<streamsize>::max(), '\n');
                cin.get();
                continue;
            }

            // 5. BATALKAN SEMUA & KEMBALI
            if (stallChoice == 5) {
                if (!cart.empty()) {
                    cout << "\nMembatalkan pesanan... Mengembalikan stok makanan...\n";
                    for (const auto& orderItem : cart) {
                        // Kembalikan stok yang sempat dikurangi saat ditambahkan ke keranjang
                        Menu* itemPtr = findMenu(menus, orderItem.itemName);
                        if (itemPtr != nullptr) {
                            itemPtr->stock += orderItem.quantity;
                        }
                    }
                    saveMenuToFile(menus);
                    cart.clear();
                }
                break;
            }

            // 4. CHECKOUT & BAYAR
            if (stallChoice == 4) {
                if (cart.empty()) {
                    cout << "\nKeranjang kosong! Anda belum memesan apapun.\n";
                    cout << "Tekan Enter untuk melanjutkan...";
                    cin.ignore(numeric_limits<streamsize>::max(), '\n');
                    cin.get();
                    continue;
                }
                
                clearScreen();
                
                // Kalkulasi promo diskon secara dinamis
                double subtotal = 0.0;
                for (const auto& item : cart) {
                    subtotal += item.totalCost;
                }
                
                double discount = 0.0;
                if (subtotal >= 50000.0) {
                    discount = 5000.0; // Promo flat Rp 5.000 jika jajan >= Rp 50.000
                    cout << "=================================================================\n";
                    cout << "   [PROMO DAHSYAT KANTIN] Potongan Diskon Rp 5.000 Diterapkan!    \n";
                    cout << "=================================================================\n\n";
                }
                
                // Jalankan fungsi cetak struk.
                // Parameter 2 dan 3 akan menggunakan Default Argument jika tidak dikirim (Pajak PPN = 10%)
                printReceipt(cart, discount);

                // Update data stok final di file database
                saveMenuToFile(menus);
                
                // Kosongkan keranjang setelah selesai transaksi
                cart.clear();

                cout << "Tekan Enter untuk kembali ke layar peran...";
                cin.ignore(numeric_limits<streamsize>::max(), '\n');
                cin.get();
                break; 
            }

            // Memilih Stall Makan (1, 2, atau 3)
            while (true) {
                clearScreen();
                string stallName = "Stall Ibu Kantin " + to_string(stallChoice);
                displayHeader("MENU MAKANAN - " + stallName);

                // Ambil daftar menu sesuai Stall
                vector<Menu> stallMenus;
                for (auto it = menus.begin(); it != menus.end(); ++it) {
                    if (it->stallId == stallChoice) {
                        stallMenus.push_back(*it);
                    }
                }

                if (stallMenus.empty()) {
                    cout << "Maaf, stall ini sedang kosong atau belum beroperasi.\n";
                    cout << "\nTekan Enter untuk kembali ke Stall Selection...";
                    cin.ignore(numeric_limits<streamsize>::max(), '\n');
                    cin.get();
                    break;
                }

                // =========================================================================
                // [9] STL ALGORITHM (sort): Sortir menu berdasarkan harga termurah ke termahal
                // [11] LAMBDA EXPRESSION: Kriteria sorting harga
                // =========================================================================
                sort(stallMenus.begin(), stallMenus.end(), [](const Menu& a, const Menu& b) {
                    return a.price < b.price;
                });

                displayMenus(stallMenus);
                printLine('-', 65);
                cout << "Ketik ID Menu untuk memesan (Ketik 0 untuk selesai belanja di stall ini): ";

                int orderId = 0;
                try {
                    cin >> orderId;
                    if (!cin) {
                        cin.clear();
                        cin.ignore(numeric_limits<streamsize>::max(), '\n');
                        throw invalid_argument("Format ID Menu salah, harus berupa angka!");
                    }
                } catch (const exception& e) {
                    cout << "\nError: " << e.what() << "\nTekan Enter untuk melanjutkan...";
                    cin.get();
                    continue;
                }

                if (orderId == 0) break;

                // Cari item menu menggunakan overload pencarian ID
                // [3] POINTER (*): Menggunakan pointer untuk manipulasi data stok menu
                Menu* itemPtr = findMenu(menus, orderId);

                try {
                    // Validasi kepemilikan item menu di stall yang sedang dibuka
                    if (itemPtr == nullptr || itemPtr->stallId != stallChoice) {
                        throw out_of_range("Peringatan: ID Menu tidak terdaftar di stall ini!");
                    }
                    
                    if (itemPtr->stock == 0) {
                        throw runtime_error("Maaf, stok item \"" + itemPtr->name + "\" habis!");
                    }

                    cout << "Pilihan: " << itemPtr->name << " | Harga: Rp " << itemPtr->price << " | Stok: " << itemPtr->stock << "\n";
                    int qty = getValidInput<int>("Masukkan Jumlah Porsi: ");

                    if (qty <= 0) {
                        throw invalid_argument("Jumlah pesanan minimal adalah 1 porsi!");
                    }
                    if (qty > itemPtr->stock) {
                        // [8] EXCEPTION HANDLING: Lempar exception saat pesanan melebihi stok yang tersedia
                        throw runtime_error("Gagal: Stok tidak mencukupi! Hanya tersedia " + to_string(itemPtr->stock) + " porsi.");
                    }

                    // Pengurangan stok sementara di memori melalui pointer dereference implisit
                    itemPtr->stock -= qty;

                    // Masukkan ke keranjang belanja
                    // [9] STL ALGORITHM (find_if) untuk mencari apakah menu tersebut sudah ada di cart
                    auto cartIt = find_if(cart.begin(), cart.end(), [itemPtr](const Order& o) {
                        return o.itemName == itemPtr->name;
                    });

                    if (cartIt != cart.end()) {
                        cartIt->quantity += qty;
                        cartIt->totalCost = cartIt->quantity * cartIt->pricePerUnit;
                    } else {
                        // Inisialisasi order baru lengkap dengan stallChoice sebagai stallId
                        Order newOrder = { itemPtr->name, qty, itemPtr->price, qty * itemPtr->price, stallChoice };
                        cart.push_back(newOrder);
                    }

                    cout << "\nSukses: Berhasil menambahkan " << qty << " porsi " << itemPtr->name << " ke keranjang belanja!\n";
                    cout << "\nTekan Enter untuk melanjutkan...";
                    cin.ignore(numeric_limits<streamsize>::max(), '\n');
                    cin.get();

                } catch (const exception& e) {
                    cout << "\nGagal Memesan: " << e.what() << "\nTekan Enter untuk melanjutkan...";
                    cin.ignore(numeric_limits<streamsize>::max(), '\n');
                    cin.get();
                }
            }
        }
    }
}

// Fungsi utama pengeksekusi program
int main() {
    // Muat data menu dari database file saat pertama kali dibuka
    vector<CanteenSystem::Menu> menus = CanteenSystem::loadMenuFromFile();

    while (true) {
        CanteenSystem::clearScreen();
        CanteenSystem::displayHeader("SISTEM PEMESANAN MAKANAN KANTIN SEKOLAH (UAS)");
        cout << "Silakan Pilih Peran/Mode Akses Anda:\n\n";
        cout << " [1] Masuk Sebagai Pembeli (Pesan Makan/Minum)\n";
        cout << " [2] Masuk Sebagai Ibu Kantin (Kelola Menu & Stok)\n";
        cout << " [3] Keluar dari Aplikasi\n";
        CanteenSystem::printLine('-', 65);

        int roleChoice = 0;
        try {
            roleChoice = CanteenSystem::getValidInput<int>("Masukkan Pilihan Peran (1-3): ");
            if (roleChoice < 1 || roleChoice > 3) {
                throw out_of_range("Pilihan peran tidak valid! Silakan masukkan angka 1 hingga 3.");
            }
        } catch (const exception& e) {
            cout << "\n" << e.what() << "\nTekan Enter untuk melanjutkan...";
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cin.get();
            continue;
        }

        // Keluar program
        if (roleChoice == 3) {
            CanteenSystem::clearScreen();
            CanteenSystem::displayHeader("APLIKASI SELESAI");
            cout << "Seluruh data menu mutakhir disimpan ke \"" << CanteenSystem::DB_FILE << "\".\n";
            cout << "Sampai jumpa kembali!\n\n";
            break;
        }

        // Pilihan Peran
        if (roleChoice == 1) {
            CanteenSystem::handlePembeli(menus);
        } else if (roleChoice == 2) {
            CanteenSystem::handleIbuKantin(menus);
        }
    }

    return 0;
}
