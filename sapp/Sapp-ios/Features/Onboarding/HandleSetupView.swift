import SwiftUI
import Combine

struct HandleSetupView: View {
    @StateObject private var viewModel = HandleSetupViewModel()
    @Environment(\.dismiss) private var dismiss
    
    let email: String
    let privyUserId: String?
    let onComplete: (SappUserInfo) -> Void
    
    var body: some View {
        NavigationStack {
            VStack(spacing: SappSpacing.xl) {
                Spacer()
                
                headerSection
                
                handleInputSection

                Spacer()
                
                continueButton
            }
            .padding(.horizontal, SappSpacing.lg)
            .padding(.bottom, SappSpacing.xl)
            .background(SappColors.background)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(SappColors.textSecondary)
                }
            }
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage)
            }
        }
    }
    
    // MARK: - Header
    
    private var headerSection: some View {
        VStack(spacing: SappSpacing.md) {
            ZStack {
                Circle()
                    .fill(SappColors.accentLight)
                    .frame(width: 80, height: 80)
                
                Text("@")
                    .font(.system(size: 36, weight: .bold))
                    .foregroundColor(SappColors.accent)
            }
            
            Text("Choose your handle")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(SappColors.textPrimary)
            
            Text("This is how others will find and message you")
                .font(.subheadline)
                .foregroundColor(SappColors.textSecondary)
                .multilineTextAlignment(.center)
        }
    }
    
    // MARK: - Handle Input
    
    private var handleInputSection: some View {
        VStack(alignment: .leading, spacing: SappSpacing.sm) {
            Text("Handle")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(SappColors.textSecondary)
            
            HStack(spacing: SappSpacing.xs) {
                Text("@")
                    .font(.body)
                    .foregroundColor(SappColors.textSecondary)
                
                TextField("yourhandle", text: $viewModel.handle)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .font(.body)
                    .foregroundColor(SappColors.textPrimary)
                    .onChange(of: viewModel.handle) { _, newValue in
                        viewModel.validateHandle(newValue)
                    }
                
                if viewModel.isCheckingAvailability {
                    ProgressView()
                        .scaleEffect(0.8)
                } else if viewModel.isHandleValid {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                } else if !viewModel.handle.isEmpty && !viewModel.handleError.isEmpty {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.red)
                }
            }
            .padding()
            .background(SappColors.surface)
            .cornerRadius(SappRadius.medium)
            
            if !viewModel.handleError.isEmpty {
                Text(viewModel.handleError)
                    .font(.caption)
                    .foregroundColor(.red)
            } else {
                Text("3-20 characters, lowercase letters, numbers, and underscores")
                    .font(.caption)
                    .foregroundColor(SappColors.textTertiary)
            }
        }
    }

    // MARK: - Continue Button
    
    private var continueButton: some View {
        Button {
            Task {
                if let userInfo = await viewModel.register(
                    email: email,
                    privyUserId: privyUserId
                ) {
                    onComplete(userInfo)
                    dismiss()
                }
            }
        } label: {
            HStack {
                if viewModel.isRegistering {
                    ProgressView()
                        .tint(.white)
                } else {
                    Text("Continue")
                        .fontWeight(.semibold)
                }
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(viewModel.canContinue ? SappColors.accent : SappColors.accent.opacity(0.5))
            .foregroundColor(.white)
            .cornerRadius(SappRadius.medium)
        }
        .disabled(!viewModel.canContinue || viewModel.isRegistering)
    }
}

// MARK: - ViewModel

@MainActor
final class HandleSetupViewModel: ObservableObject {
    @Published var handle: String = ""
    @Published var handleError: String = ""
    @Published var isCheckingAvailability: Bool = false
    @Published var isHandleValid: Bool = false
    @Published var isRegistering: Bool = false
    @Published var showError: Bool = false
    @Published var errorMessage: String = ""
    
    private let apiService = SappAPIService.shared
    private var checkTask: Task<Void, Never>?
    
    var canContinue: Bool {
        isHandleValid && !isCheckingAvailability && !isRegistering
    }
    
    func validateHandle(_ input: String) {
        checkTask?.cancel()
        
        let normalized = input.lowercased().trimmingCharacters(in: .whitespaces)
        handle = normalized
        
        if normalized.isEmpty {
            handleError = ""
            isHandleValid = false
            return
        }
        
        let regex = try? NSRegularExpression(pattern: "^[a-z0-9_]+$")
        let range = NSRange(normalized.startIndex..., in: normalized)
        let isValidFormat = regex?.firstMatch(in: normalized, range: range) != nil
        
        if !isValidFormat {
            handleError = "Only lowercase letters, numbers, and underscores"
            isHandleValid = false
            return
        }
        
        if normalized.count < 3 {
            handleError = "Must be at least 3 characters"
            isHandleValid = false
            return
        }
        
        if normalized.count > 20 {
            handleError = "Must be at most 20 characters"
            isHandleValid = false
            return
        }
        
        handleError = ""
        isCheckingAvailability = true
        
        checkTask = Task {
            try? await Task.sleep(nanoseconds: 500_000_000)
            
            guard !Task.isCancelled else { return }
            
            do {
                let available = try await apiService.isHandleAvailable(normalized)
                
                guard !Task.isCancelled else { return }
                
                if available {
                    isHandleValid = true
                    handleError = ""
                } else {
                    isHandleValid = false
                    handleError = "This handle is already taken"
                }
            } catch {
                guard !Task.isCancelled else { return }
                isHandleValid = false
                handleError = "Could not check availability"
            }
            
            isCheckingAvailability = false
        }
    }
    
    func register(email: String, privyUserId: String?) async -> SappUserInfo? {
        guard canContinue else { return nil }
        
        isRegistering = true
        defer { isRegistering = false }
        
        do {
            let userInfo = try await apiService.register(
                email: email,
                handle: handle,
                privyUserId: privyUserId
            )
            return userInfo
        } catch let error as SappAPIError {
            errorMessage = error.localizedDescription
            showError = true
            return nil
        } catch {
            errorMessage = error.localizedDescription
            showError = true
            return nil
        }
    }
}

#Preview {
    HandleSetupView(
        email: "test@example.com",
        privyUserId: nil
    ) { userInfo in
        print("Registered: @\(userInfo.handle)")
    }
}
